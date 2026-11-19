import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getPatternDetail } from '../data.ts';
import { findEach } from '../find-each.ts';

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
	const { found, missing } = await findEach( slug, getPatternDetail );
	const list = missing.map( ( key ) => `"${ key }"` ).join( ', ' );

	if ( found.length === 0 ) {
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

	let text = found
		.map( ( pattern ) => pattern.content )
		.join( '\n\n---\n\n' );
	if ( missing.length > 0 ) {
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
				'Get the full guidance for one or more WordPress Design System patterns. A pattern explains which components to choose for a kind of interaction and how to configure them. Use the slugs listed by get_patterns. Pass multiple slugs to fetch several patterns in a single call instead of making repeated calls.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		handler
	);
}
