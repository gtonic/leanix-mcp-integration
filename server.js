import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { LeanIXClient } from "./leanix-client.js";
import { config } from "./src/config/config.js";
import { registerWorkspaceTools } from "./src/tools/workspaceTools.js";

const app = express();
app.use(express.json());

// Store transports for each session type
const transports = {
  streamable: {},
  sse: {}
};

// Helper function to create and configure MCP server
const createMcpServer = () => {
  const server = new McpServer({
    name: "LeanIX MCP Server",
    version: "1.0.0"
  });

  // Initialize LeanIX client and register tools
  const leanixClient = new LeanIXClient(config.subdomain, config.token);
  registerWorkspaceTools(server, leanixClient);

  return server;
};

// Modern Streamable HTTP endpoint
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports.streamable[sessionId]) {
    // Reuse existing transport
    transport = transports.streamable[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports.streamable[sessionId] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports.streamable[transport.sessionId];
      }
    };

    // Create and connect MCP server
    const server = createMcpServer();
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests (modern transport)
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports.streamable[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports.streamable[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE (modern transport)
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination (modern transport)
app.delete('/mcp', handleSessionRequest);

// Legacy SSE endpoint for older clients
app.get('/sse', async (req, res) => {
  try {
    // Create SSE transport for legacy clients
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId || randomUUID();

    // Store transport with session ID
    transports.sse[sessionId] = transport;

    // Clean up on connection close
    res.on("close", () => {
      delete transports.sse[sessionId];
    });

    // Create and connect MCP server
    const server = createMcpServer();
    await server.connect(transport);

    console.log(`Legacy SSE client connected with session ID: ${sessionId}`);
  } catch (error) {
    console.error('Error setting up SSE transport:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Legacy message endpoint for older clients
app.post('/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Missing sessionId parameter'
        },
        id: null
      });
      return;
    }

    const transport = transports.sse[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'No transport found for sessionId'
        },
        id: null
      });
    }
  } catch (error) {
    console.error('Error handling legacy message:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error'
      },
      id: null
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'LeanIX MCP Server',
    version: '1.0.0',
    transports: {
      streamable: Object.keys(transports.streamable).length,
      sse: Object.keys(transports.sse).length
    }
  });
});

const PORT = process.env.PORT || 8089;

app.listen(PORT, () => {
  console.log(`LeanIX MCP server running on port ${PORT}`);
  console.log(`Modern clients: POST/GET/DELETE /mcp`);
  console.log(`Legacy clients: GET /sse, POST /messages`);
  console.log(`Health check: GET /health`);
});
