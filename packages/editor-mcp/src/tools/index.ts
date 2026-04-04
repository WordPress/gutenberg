import type { Transport } from '../transports/types.js';
import {
	lookupBlock,
	searchBlocks,
	loadBlockCatalog,
} from '../block-catalog.js';

type ToolResult = {
	content: Array<
		| { type: 'text'; text: string }
		| { type: 'image'; data: string; mimeType: string }
	>;
};

function text( data: unknown ): ToolResult {
	return {
		content: [
			{
				type: 'text',
				text:
					typeof data === 'string'
						? data
						: JSON.stringify( data, null, 2 ),
			},
		],
	};
}

interface JsonSchema {
	type: string;
	properties?: Record< string, unknown >;
	required?: string[];
}

export interface ToolDef {
	name: string;
	description: string;
	inputSchema: JsonSchema;
	handler: (
		args: Record< string, unknown >,
		transport: Transport
	) => Promise< ToolResult >;
}

const blockDefSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			description: 'Block name, e.g. core/paragraph',
		},
		attributes: { type: 'object', description: 'Block attributes' },
		innerBlocks: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					attributes: { type: 'object' },
				},
				required: [ 'name' ],
			},
			description: 'Nested inner blocks',
		},
	},
	required: [ 'name' ],
};

export const tools: ToolDef[] = [
	// 1. wp_get_editor_state
	{
		name: 'wp_get_editor_state',
		description:
			'Get the current editor state: active template/page, dirty state, selected block.',
		inputSchema: { type: 'object', properties: {} },
		handler: async ( _args, transport ) => {
			const state = await transport.getEditorState();
			return text( state );
		},
	},

	// 2. wp_open_document
	{
		name: 'wp_open_document',
		description:
			'Navigate the editor to a specific template, page, template-part, or pattern.',
		inputSchema: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: [ 'template', 'page', 'template-part', 'pattern' ],
					description: 'Document type to open',
				},
				slug: {
					type: 'string',
					description: 'Template or pattern slug',
				},
				id: { type: 'number', description: 'Page or entity ID' },
			},
			required: [ 'type' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.openDocument(
				args as {
					type: 'template' | 'page' | 'template-part' | 'pattern';
					slug?: string;
					id?: number;
				}
			);
			return text( result );
		},
	},

	// 3. wp_get_blocks
	{
		name: 'wp_get_blocks',
		description:
			'Read the block tree from the editor. Optionally filter by root block or block name.',
		inputSchema: {
			type: 'object',
			properties: {
				rootClientId: {
					type: 'string',
					description: 'Only return children of this block',
				},
				blockName: {
					type: 'string',
					description: 'Filter blocks by name (e.g. core/paragraph)',
				},
			},
		},
		handler: async ( args, transport ) => {
			const blocks = await transport.getBlocks(
				args as { rootClientId?: string; blockName?: string }
			);
			return text( blocks );
		},
	},

	// 4. wp_insert_blocks
	{
		name: 'wp_insert_blocks',
		description:
			'Insert new blocks into the editor. Blocks are created from name + attributes.',
		inputSchema: {
			type: 'object',
			properties: {
				blocks: {
					type: 'array',
					items: blockDefSchema,
					description: 'Blocks to insert',
				},
				rootClientId: {
					type: 'string',
					description: 'Parent block to insert into',
				},
				index: { type: 'number', description: 'Position to insert at' },
			},
			required: [ 'blocks' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.insertBlocks(
				args as Parameters< Transport[ 'insertBlocks' ] >[ 0 ]
			);
			return text( result );
		},
	},

	// 5. wp_update_block
	{
		name: 'wp_update_block',
		description: 'Update attributes on an existing block by clientId.',
		inputSchema: {
			type: 'object',
			properties: {
				clientId: {
					type: 'string',
					description: 'Block clientId to update',
				},
				attributes: {
					type: 'object',
					description: 'Attributes to merge into the block',
				},
			},
			required: [ 'clientId', 'attributes' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.updateBlock(
				args as {
					clientId: string;
					attributes: Record< string, unknown >;
				}
			);
			return text( result );
		},
	},

	// 6. wp_remove_blocks
	{
		name: 'wp_remove_blocks',
		description: 'Remove blocks by their clientIds.',
		inputSchema: {
			type: 'object',
			properties: {
				clientIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Block clientIds to remove',
				},
			},
			required: [ 'clientIds' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.removeBlocks(
				args as { clientIds: string[] }
			);
			return text( result );
		},
	},

	// 7. wp_replace_blocks
	{
		name: 'wp_replace_blocks',
		description:
			'Replace existing blocks with new ones. Swaps block content in place.',
		inputSchema: {
			type: 'object',
			properties: {
				clientIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Block clientIds to replace',
				},
				blocks: {
					type: 'array',
					items: blockDefSchema,
					description: 'Replacement blocks',
				},
			},
			required: [ 'clientIds', 'blocks' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.replaceBlocks(
				args as Parameters< Transport[ 'replaceBlocks' ] >[ 0 ]
			);
			return text( result );
		},
	},

	// 8. wp_save
	{
		name: 'wp_save',
		description: 'Save / persist current editor changes to the database.',
		inputSchema: { type: 'object', properties: {} },
		handler: async ( _args, transport ) => {
			const result = await transport.save();
			return text( result );
		},
	},

	// 9. wp_lookup_block
	{
		name: 'wp_lookup_block',
		description:
			'Look up block schema info: attributes, supports, keywords, whether it has dynamic rendering. Query by block name, title, or keyword.',
		inputSchema: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description:
						'Block name (core/paragraph), short name (paragraph), title, or keyword',
				},
				search: {
					type: 'boolean',
					description:
						'If true, return all matching blocks instead of best match',
				},
				listAll: {
					type: 'boolean',
					description:
						'If true, return all block names in the catalog',
				},
			},
			required: [ 'query' ],
		},
		handler: async ( args ) => {
			const { query, search, listAll } = args as {
				query: string;
				search?: boolean;
				listAll?: boolean;
			};

			if ( listAll ) {
				const catalog = await loadBlockCatalog();
				const names = Array.from( catalog.keys() ).sort();
				return text( { count: names.length, blocks: names } );
			}

			if ( search ) {
				const results = await searchBlocks( query );
				return text( {
					count: results.length,
					blocks: results.map( ( b ) => ( {
						name: b.name,
						title: b.title,
						category: b.category,
						description: b.description,
					} ) ),
				} );
			}

			const meta = await lookupBlock( query );
			if ( ! meta ) {
				return text( { error: `Block not found: ${ query }` } );
			}
			return text( meta );
		},
	},

	// 10. wp_get_styles
	{
		name: 'wp_get_styles',
		description:
			'Read theme.json global styles and settings (colors, typography, spacing presets).',
		inputSchema: { type: 'object', properties: {} },
		handler: async ( _args, transport ) => {
			const styles = await transport.getStyles();
			return text( styles );
		},
	},

	// 11. wp_set_styles
	{
		name: 'wp_set_styles',
		description:
			'Update theme.json global styles or settings (e.g. color palette, font sizes).',
		inputSchema: {
			type: 'object',
			properties: {
				settings: {
					type: 'object',
					description: 'theme.json settings to update',
				},
				styles: {
					type: 'object',
					description: 'theme.json styles to update',
				},
			},
		},
		handler: async ( args, transport ) => {
			const result = await transport.setStyles(
				args as {
					settings?: Record< string, unknown >;
					styles?: Record< string, unknown >;
				}
			);
			return text( result );
		},
	},

	// 12. wp_get_screenshot
	{
		name: 'wp_get_screenshot',
		description:
			'Capture a screenshot of the editor canvas. CDP transport only.',
		inputSchema: {
			type: 'object',
			properties: {
				selector: {
					type: 'string',
					description: 'CSS selector to capture (default: full page)',
				},
				fullPage: {
					type: 'boolean',
					description: 'Capture full scrollable page',
				},
			},
		},
		handler: async ( args, transport ) => {
			const result = await transport.getScreenshot(
				args as { selector?: string; fullPage?: boolean }
			);
			return {
				content: [
					{
						type: 'image' as const,
						data: result.base64,
						mimeType: result.mimeType,
					},
				],
			};
		},
	},

	// 13. wp_get_computed_layout
	{
		name: 'wp_get_computed_layout',
		description:
			'Get bounding rectangles and computed CSS for blocks. CDP transport only.',
		inputSchema: {
			type: 'object',
			properties: {
				clientIds: {
					type: 'array',
					items: { type: 'string' },
					description: 'Block clientIds to measure',
				},
				properties: {
					type: 'array',
					items: { type: 'string' },
					description:
						'CSS properties to read (default: display, position, width, height, margin, padding, gap)',
				},
			},
			required: [ 'clientIds' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.getComputedLayout(
				args as { clientIds: string[]; properties?: string[] }
			);
			return text( result );
		},
	},

	// 14. wp_parse_markup
	{
		name: 'wp_parse_markup',
		description:
			'Parse and validate block markup (HTML with block comment delimiters) into a block tree.',
		inputSchema: {
			type: 'object',
			properties: {
				markup: {
					type: 'string',
					description:
						'Block markup, e.g. <!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
				},
			},
			required: [ 'markup' ],
		},
		handler: async ( args, transport ) => {
			const result = await transport.parseMarkup(
				args as { markup: string }
			);
			return text( result );
		},
	},

	// 15. wp_export
	{
		name: 'wp_export',
		description:
			'Export the current template/page as serialized block HTML.',
		inputSchema: { type: 'object', properties: {} },
		handler: async ( _args, transport ) => {
			const result = await transport.exportTemplate();
			return text( result );
		},
	},
];
