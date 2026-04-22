import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getComponentDetail } from '../data';
import { formatComponentDetail } from '../format';

/**
 * Register the get_component_details tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_component_details',
		{
			title: 'Get Component Details',
			description:
				'Get detailed documentation for a WordPress Design System component including props, usage examples, and import statements.',
			inputSchema: z.object( {
				name: z
					.string()
					.min( 1 )
					.describe( 'The component name (e.g. "Button", "Tabs")' ),
			} ),
			annotations: {
				readOnlyHint: true,
			},
		},
		async ( { name } ) => {
			const detail = await getComponentDetail( name );
			if ( ! detail ) {
				return {
					content: [
						{
							type: 'text',
							text: `No component named "${ name }" was found.`,
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: 'text',
						text: formatComponentDetail( detail ),
					},
				],
			};
		}
	);
}
