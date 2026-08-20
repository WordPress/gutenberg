import type { McpServer } from '@modelcontextprotocol/server';
import { getComponents } from '../data';
import { formatComponents } from '../format';

/**
 * Register the get_components tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_components',
		{
			title: 'Get Components',
			description:
				'Get a list of all available WordPress Design System components with their package names and descriptions.',
			annotations: {
				readOnlyHint: true,
			},
		},
		async () => {
			const components = await getComponents();
			return {
				content: [
					{
						type: 'text',
						text: formatComponents( components ),
					},
				],
			};
		}
	);
}
