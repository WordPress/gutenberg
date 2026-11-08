import type { McpServer } from '@modelcontextprotocol/server';
import { register as getComponents } from './get-components.ts';
import { register as getComponentDetails } from './get-component-details.ts';
import { register as getDesignTokens } from './get-design-tokens.ts';
import { register as getPatterns } from './get-patterns.ts';
import { register as getPatternDetails } from './get-pattern-details.ts';

/**
 * Register all MCP tools on the server.
 *
 * @param server - The MCP server instance.
 */
export function registerTools( server: McpServer ): void {
	getComponents( server );
	getComponentDetails( server );
	getDesignTokens( server );
	getPatterns( server );
	getPatternDetails( server );
}
