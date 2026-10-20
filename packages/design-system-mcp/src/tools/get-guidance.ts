import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getGuidance, getGuidanceList } from '../data.ts';
import { formatGuidance, formatGuidanceList } from '../format.ts';

const inputSchema = z.object( {
	topic: z
		.string()
		.min( 1 )
		.optional()
		.describe(
			'A guidance page id or title, or a component name (e.g. "Button") to get every page attached to it. Omit to list all available pages.'
		),
} );

export async function handler( { topic }: z.infer< typeof inputSchema > ) {
	if ( ! topic ) {
		const pages = await getGuidanceList();
		return {
			content: [
				{ type: 'text' as const, text: formatGuidanceList( pages ) },
			],
		};
	}

	const pages = await getGuidance( topic );
	if ( pages.length === 0 ) {
		return {
			content: [
				{
					type: 'text' as const,
					text: `No guidance was found for "${ topic }". Call get_guidance without a topic to list available pages.`,
				},
			],
			isError: true,
		};
	}

	return {
		content: [ { type: 'text' as const, text: formatGuidance( pages ) } ],
	};
}

/**
 * Register the get_guidance tool.
 *
 * @param server - The MCP server instance.
 */
export function register( server: McpServer ): void {
	server.registerTool(
		'get_guidance',
		{
			title: 'Get Guidance',
			description:
				'Get design guidance written by the WordPress Design System team: usage guidelines, best practices, and migration guides. Use this before choosing between similar components (e.g. Button, Link, ButtonLink), and when moving from a `@wordpress/components` component to its `@wordpress/ui` equivalent. Call without a topic to list pages, or pass a page id or component name to read them.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		handler
	);
}
