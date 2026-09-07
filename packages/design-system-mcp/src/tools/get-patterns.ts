import type { McpServer } from '@modelcontextprotocol/server';
import { getPatterns } from '../data.ts';
import { formatPatterns } from '../format.ts';

/**
 * Register the get_patterns tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_patterns',
		{
			title: 'Get Patterns',
			description:
				'Get a list of the WordPress Design System patterns: the cross-cutting guidance on how to compose components into a user interaction, such as confirming a destructive action, saving a form, or wording an error message.',
			annotations: {
				readOnlyHint: true,
			},
		},
		async () => {
			return {
				content: [
					{
						type: 'text',
						text: formatPatterns( getPatterns() ),
					},
				],
			};
		}
	);
}
