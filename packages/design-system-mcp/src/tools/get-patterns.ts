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
				'List the WordPress Design System patterns, each with a short description. A pattern explains how to approach a specific kind of interaction, such as confirming a destructive action or saving a form. Check this list before building an interface or a user flow. The list does not cover every interaction: use a pattern only when it fits the situation, and otherwise work from the components.',
			annotations: {
				readOnlyHint: true,
			},
		},
		async () => {
			return {
				content: [
					{
						type: 'text',
						text: formatPatterns( await getPatterns() ),
					},
				],
			};
		}
	);
}
