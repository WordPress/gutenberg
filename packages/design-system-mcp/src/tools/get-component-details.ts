import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getComponentDetail } from '../data.ts';
import { formatComponentDetail } from '../format.ts';
import { findEach } from '../find-each.ts';

const inputSchema = z.object( {
	name: z
		.union( [
			z.string().min( 1 ),
			z.array( z.string().min( 1 ) ).min( 1 ).max( 10 ),
		] )
		.describe(
			'A component name, or an array of component names to fetch in a single call (e.g. "Button" or ["Button", "Tabs"]).'
		),
} );

export async function handler( { name }: z.infer< typeof inputSchema > ) {
	const { found, missing } = await findEach( name, getComponentDetail );
	const list = missing.map( ( key ) => `"${ key }"` ).join( ', ' );

	if ( found.length === 0 ) {
		return {
			content: [
				{
					type: 'text' as const,
					text: `No components were found for: ${ list }.`,
				},
			],
			isError: true,
		};
	}

	let text = found.map( formatComponentDetail ).join( '\n\n---\n\n' );
	if ( missing.length > 0 ) {
		text += `\n\n---\n\n_No components were found for: ${ list }._`;
	}

	return {
		content: [
			{
				type: 'text' as const,
				text,
			},
		],
	};
}

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
				'Get detailed documentation for one or more WordPress Design System components including props, usage examples, and import statements. Pass multiple names to fetch several components in a single call instead of making repeated calls.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		handler
	);
}
