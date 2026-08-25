import type { McpServer } from '@modelcontextprotocol/server';
import { register as getComponents } from './get-components';
import { register as getComponentDetails } from './get-component-details';
import { register as getDesignTokens } from './get-design-tokens';

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
