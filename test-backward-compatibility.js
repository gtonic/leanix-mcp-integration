import fetch from 'node:fetch';

const SERVER_URL = 'http://localhost:8089';

// Test modern Streamable HTTP transport
async function testModernTransport() {
    console.log('\n=== Testing Modern Streamable HTTP Transport ===');

    try {
        // Initialize request
        const initRequest = {
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    roots: {
                        listChanged: true
                    }
                },
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            },
            id: 1
        };

        const response = await fetch(`${SERVER_URL}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initRequest)
        });

        const result = await response.json();
        console.log('Modern transport response:', JSON.stringify(result, null, 2));

        // Extract session ID from response headers
        const sessionId = response.headers.get('mcp-session-id');
        console.log('Session ID:', sessionId);

        return sessionId;
    } catch (error) {
        console.error('Modern transport test failed:', error.message);
        return null;
    }
}

// Test legacy SSE transport
async function testLegacyTransport() {
    console.log('\n=== Testing Legacy SSE Transport ===');

    try {
        // This would normally establish an SSE connection
        // For testing purposes, we'll just check if the endpoint responds
        const response = await fetch(`${SERVER_URL}/sse`, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            }
        });

        console.log('Legacy SSE endpoint status:', response.status);
        console.log('Legacy SSE endpoint headers:', Object.fromEntries(response.headers.entries()));

        // Note: In a real scenario, you'd parse the SSE stream to get the session ID
        // and then use it for subsequent POST requests to /messages

        return response.status === 200;
    } catch (error) {
        console.error('Legacy transport test failed:', error.message);
        return false;
    }
}

// Test health endpoint
async function testHealthEndpoint() {
    console.log('\n=== Testing Health Endpoint ===');

    try {
        const response = await fetch(`${SERVER_URL}/health`);
        const health = await response.json();
        console.log('Health check:', JSON.stringify(health, null, 2));
        return health.status === 'healthy';
    } catch (error) {
        console.error('Health check failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🧪 Testing LeanIX MCP Server Backward Compatibility');

    const healthOk = await testHealthEndpoint();
    const modernSessionId = await testModernTransport();
    const legacyOk = await testLegacyTransport();

    console.log('\n=== Test Results ===');
    console.log('✅ Health endpoint:', healthOk ? 'PASS' : 'FAIL');
    console.log('✅ Modern transport:', modernSessionId ? 'PASS' : 'FAIL');
    console.log('✅ Legacy transport:', legacyOk ? 'PASS' : 'FAIL');

    if (healthOk && modernSessionId && legacyOk) {
        console.log('\n🎉 All backward compatibility tests passed!');
    } else {
        console.log('\n❌ Some tests failed. Check the server logs.');
    }
}

runTests().catch(console.error);
