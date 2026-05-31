import type { McpServer } from '@modelcontextprotocol/server';
import { getDesignTokens } from '../data';

/**
 * Register the get_design_tokens tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_design_tokens',
		{
			title: 'Get Design Tokens',
			description:
				'Get the WordPress Design System design tokens reference (colors, spacing, typography, elevation, etc.).',
			annotations: {
				readOnlyHint: true,
			},
		},
		async () => {
			const tokens = await getDesignTokens();
			return {
				content: [
					{
						type: 'text',
						text: tokens.content,
					},
				],
			};
		}
	);
}
