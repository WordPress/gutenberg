import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getComponentDetail } from '../data';
import { formatComponentDetail } from '../format';

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
	const names = Array.isArray( name ) ? name : [ name ];
	const sections: string[] = [];
	const missing: string[] = [];

	for ( const componentName of names ) {
		const detail = await getComponentDetail( componentName );
		if ( detail ) {
			sections.push( formatComponentDetail( detail ) );
		} else {
			missing.push( componentName );
		}
	}

	if ( sections.length === 0 ) {
		const list = missing.map( ( n ) => `"${ n }"` ).join( ', ' );
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

	let text = sections.join( '\n\n---\n\n' );
	if ( missing.length > 0 ) {
		const list = missing.map( ( n ) => `"${ n }"` ).join( ', ' );
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
