import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './tools/index';

export function createServer() {
	const server = new McpServer( {
		name: 'WordPress Design System',
		version: '0.1.0',
	} );

	registerTools( server );

	return server;
}
