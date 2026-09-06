import type { McpServer } from '@modelcontextprotocol/server';
import { register as getComponents } from './get-components.ts';
import { register as getComponentDetails } from './get-component-details.ts';
import { register as getDesignTokens } from './get-design-tokens.ts';

/**
 * Register all MCP tools on the server.
 *
 * @param server - The MCP server instance.
 */
export function registerTools( server: McpServer ): void {
	getComponents( server );
	getComponentDetails( server );
	getDesignTokens( server );
}
