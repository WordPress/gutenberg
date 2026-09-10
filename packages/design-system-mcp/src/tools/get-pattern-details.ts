import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getPatternDetail } from '../data.ts';

const inputSchema = z.object( {
	slug: z
		.union( [
			z.string().min( 1 ),
			z.array( z.string().min( 1 ) ).min( 1 ).max( 10 ),
		] )
		.describe(
			'A pattern slug, or an array of pattern slugs to fetch in a single call (e.g. "destructive-actions" or ["destructive-actions", "error-messages"]).'
		),
} );

export async function handler( { slug }: z.infer< typeof inputSchema > ) {
	const slugs = Array.isArray( slug ) ? slug : [ slug ];
	const sections: string[] = [];
	const missing: string[] = [];

	for ( const patternSlug of slugs ) {
		const detail = await getPatternDetail( patternSlug );
		if ( detail ) {
			sections.push( detail.content );
		} else {
			missing.push( patternSlug );
		}
	}

	if ( sections.length === 0 ) {
		const list = missing.map( ( s ) => `"${ s }"` ).join( ', ' );
		return {
			content: [
				{
					type: 'text' as const,
					text: `No patterns were found for: ${ list }. Call get_patterns for the available slugs.`,
				},
			],
			isError: true,
		};
	}

	let text = sections.join( '\n\n---\n\n' );
	if ( missing.length > 0 ) {
		const list = missing.map( ( s ) => `"${ s }"` ).join( ', ' );
		text += `\n\n---\n\n_No patterns were found for: ${ list }._`;
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
 * Register the get_pattern_details tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_pattern_details',
		{
			title: 'Get Pattern Details',
			description:
				'Get the full guidance document for one or more WordPress Design System patterns, including the decision trees for choosing between components. Pass multiple slugs to fetch several patterns in a single call instead of making repeated calls.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		handler
	);
}
