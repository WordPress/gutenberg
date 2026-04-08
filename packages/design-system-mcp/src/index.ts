import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import { registerTools } from './tools/index';

const server = new McpServer( {
	name: 'WordPress Design System',
	version: '0.1.0',
} );

registerTools( server );

const transport = new StdioServerTransport();

await server.connect( transport );
