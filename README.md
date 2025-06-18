# LeanIX MCP Integration

A Model Context Protocol (MCP) server that connects LeanIX to AI assistants. It exposes LeanIX's GraphQL API as MCP tools that AI assistants can use.

## Core Functionality

**Streaming Compatibility:**  
This server supports Server-Sent Events (SSE) and HTTP streaming for tool responses, enabling real-time updates and compatibility with modern AI assistants and clients.  
**Note:** stdio (standard input/output) is not supported.

This integration provides five MCP tools for LeanIX operations:

1. **Fact Sheet Overview**: Get counts and statistics of fact sheets in your workspace
2. **Search**: Find fact sheets by their names
3. **Subscription Management**: View who is subscribed to specific fact sheets
4. **Create Fact Sheets**: Add new fact sheets to your workspace
5. **Update Fact Sheets**: Modify existing fact sheet information

## Prerequisites

- Node.js (v14 or higher)
- A LeanIX workspace and API token
- Basic understanding of GraphQL and MCP

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your LeanIX credentials:
   ```
   LEANIX_SUBDOMAIN=your-workspace-subdomain
   LEANIX_TOKEN=your-api-token
   ```

## Build and Run

You can run the server directly with Node.js or using Docker.

**Run with Node.js (development):**
```bash
npm install
node server.js
```

**Run with Docker:**
```bash
docker build -t leanix-mcp .
docker run --env-file .env -p 3000:3000 leanix-mcp
```
- The server will start and listen for MCP connections on the default port (see server.js for details).
- Ensure your `.env` file is present and correctly configured.


## Project Structure

```
├── server.js            # Main MCP server setup and initialization
├── leanix-client.js     # LeanIX API client implementation
├── api                  # LeanIX API definitions and endpoints
├── mutation            # GraphQL mutation definitions
├── datamodel           # Data models and type definitions
├── .env                # Environment configuration
└── src/
    ├── config/
    │   └── config.js         # Loads and validates environment variables for LeanIX credentials
    ├── graphql/
    │   └── queries/         # GraphQL queries and mutations for LeanIX API
    │       ├── factSheetQueries.js     # Queries for fact sheet operations
    │       └── workspaceQueries.js     # Queries for workspace-level operations
    ├── tools/
    │   └── workspaceTools.js # Defines and registers the five MCP tools
    ├── types/
    │   └── schemas.js       # Zod schemas for validating tool parameters
    └── utils/
        └── responseHandler.js # Formats responses in MCP-compatible structure
```

## Common Pitfalls and Solutions

1. **GraphQL Schema Mismatch**: Always check the current LeanIX API schema in their documentation or GraphiQL interface. The schema may change over time.

2. **Response Formatting**: All MCP tool responses must follow this format:
   ```javascript
   {
     content: [{
       type: "text",
       text: "your response here"
     }]
   }
   ```

3. **Error Handling**: Always wrap your tool implementations with `withErrorHandling` to ensure proper error responses.

4. **Environment Variables**: Make sure to properly load and validate environment variables before making any API calls.

## Testing Your Integration

1. Start the server:
   ```bash
   node server.js
   ```

2. The server will connect to your LeanIX workspace and make the tools available through MCP.

3. You can test your tools through any MCP-compatible client (like Claude).

## Debugging Tips

1. Enable debug logging in your configuration file to verify environment variables are loaded correctly.

2. Use the LeanIX GraphiQL interface to test your queries before implementing them in your tools.

3. Check the server console for detailed error messages when tools fail.

## Resources

- [LeanIX API Documentation](https://docs-eam.leanix.net/reference/graphql-api)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.github.io/)

## License

MIT
