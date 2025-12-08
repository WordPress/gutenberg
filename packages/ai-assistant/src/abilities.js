/**
 * WordPress dependencies
 */
import { registerAbility, registerAbilityCategory } from '@wordpress/abilities';
import { select, dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Register the block editor abilities category and all block manipulation abilities
 */
export async function registerBlockAbilities() {
	// First, register the category for block editor abilities
	await registerAbilityCategory( 'block-editor', {
		label: __( 'Block Editor' ),
		description: __(
			'Abilities for manipulating blocks in the WordPress block editor'
		),
	} );

	// Register ability to get all blocks
	await registerAbility( {
		name: 'ai-assistant/get-blocks',
		label: __( 'Get All Blocks' ),
		description: __( 'Retrieves all blocks currently in the editor' ),
		category: 'block-editor',
		output_schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					clientId: { type: 'string' },
					name: { type: 'string' },
					attributes: { type: 'object' },
					innerBlocks: { type: 'number' },
				},
			},
		},
		callback: async () => {
			const blocks = select( blockEditorStore ).getBlocks();
			return blocks.map( ( block ) => ( {
				clientId: block.clientId,
				name: block.name,
				attributes: block.attributes,
				innerBlocks: block.innerBlocks?.length || 0,
			} ) );
		},
		permission_callback: () => true,
	} );

	// Register ability to find blocks with specific text
	await registerAbility( {
		name: 'ai-assistant/find-blocks-with-text',
		label: __( 'Find Blocks with Text' ),
		description: __( 'Finds all blocks containing specific text' ),
		category: 'block-editor',
		input_schema: {
			type: 'object',
			properties: {
				searchText: {
					type: 'string',
					description: __( 'Text to search for in blocks' ),
				},
			},
			required: [ 'searchText' ],
		},
		output_schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					clientId: { type: 'string' },
					name: { type: 'string' },
					content: { type: 'string' },
				},
			},
		},
		callback: async ( { searchText } ) => {
			const blocks = select( blockEditorStore ).getBlocks();
			const matches = [];

			const searchInBlocks = ( blockList ) => {
				for ( const block of blockList ) {
					const content = block.attributes.content || '';
					if (
						content
							.toLowerCase()
							.includes( searchText.toLowerCase() )
					) {
						matches.push( {
							clientId: block.clientId,
							name: block.name,
							content,
						} );
					}

					if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
						searchInBlocks( block.innerBlocks );
					}
				}
			};

			searchInBlocks( blocks );
			return matches;
		},
		permission_callback: () => true,
	} );

	// Register ability to replace text in blocks
	await registerAbility( {
		name: 'ai-assistant/replace-text-in-blocks',
		label: __( 'Replace Text in Blocks' ),
		description: __( 'Replaces text in all matching blocks' ),
		category: 'block-editor',
		input_schema: {
			type: 'object',
			properties: {
				findText: {
					type: 'string',
					description: __( 'Text to find' ),
				},
				replaceText: {
					type: 'string',
					description: __( 'Text to replace with' ),
				},
			},
			required: [ 'findText', 'replaceText' ],
		},
		output_schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				blocksUpdated: { type: 'number' },
			},
		},
		callback: async ( { findText, replaceText } ) => {
			const blocks = select( blockEditorStore ).getBlocks();
			let updated = 0;

			const updateBlocks = ( blockList ) => {
				for ( const block of blockList ) {
					const content = block.attributes.content || '';
					if (
						content.toLowerCase().includes( findText.toLowerCase() )
					) {
						const newContent = content.replace(
							new RegExp( findText, 'gi' ),
							replaceText
						);
						dispatch( blockEditorStore ).updateBlockAttributes(
							block.clientId,
							{
								content: newContent,
							}
						);
						updated++;
					}

					if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
						updateBlocks( block.innerBlocks );
					}
				}
			};

			updateBlocks( blocks );
			return { success: true, blocksUpdated: updated };
		},
		permission_callback: () => true,
	} );

	// Register ability to insert a new block
	await registerAbility( {
		name: 'ai-assistant/insert-block',
		label: __( 'Insert Block' ),
		description: __( 'Inserts a new block into the editor' ),
		category: 'block-editor',
		input_schema: {
			type: 'object',
			properties: {
				blockType: {
					type: 'string',
					description: __( 'Type of block (e.g., core/paragraph)' ),
					default: 'core/paragraph',
				},
				content: {
					type: 'string',
					description: __( 'Content for the block' ),
				},
				position: {
					type: 'integer',
					description: __( 'Position to insert at' ),
				},
			},
			required: [ 'content' ],
		},
		output_schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				blockId: { type: 'string' },
			},
		},
		callback: async ( {
			blockType = 'core/paragraph',
			content,
			position,
		} ) => {
			const block = createBlock( blockType, { content } );
			dispatch( blockEditorStore ).insertBlock( block, position );
			return { success: true, blockId: block.clientId };
		},
		permission_callback: () => true,
	} );

	// Register ability to update a specific block
	await registerAbility( {
		name: 'ai-assistant/update-block',
		label: __( 'Update Block' ),
		description: __( 'Updates the content of a specific block' ),
		category: 'block-editor',
		input_schema: {
			type: 'object',
			properties: {
				clientId: {
					type: 'string',
					description: __( 'The block client ID' ),
				},
				newContent: {
					type: 'string',
					description: __( 'New content for the block' ),
				},
			},
			required: [ 'clientId', 'newContent' ],
		},
		output_schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				message: { type: 'string' },
			},
		},
		callback: async ( { clientId, newContent } ) => {
			dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
				content: newContent,
			} );
			return { success: true, message: 'Block updated' };
		},
		permission_callback: () => true,
	} );

	// Register ability to delete a block
	await registerAbility( {
		name: 'ai-assistant/delete-block',
		label: __( 'Delete Block' ),
		description: __( 'Deletes a block from the editor' ),
		category: 'block-editor',
		input_schema: {
			type: 'object',
			properties: {
				clientId: {
					type: 'string',
					description: __( 'The block client ID to delete' ),
				},
			},
			required: [ 'clientId' ],
		},
		output_schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				message: { type: 'string' },
			},
		},
		callback: async ( { clientId } ) => {
			dispatch( blockEditorStore ).removeBlock( clientId );
			return { success: true, message: 'Block deleted' };
		},
		permission_callback: () => true,
	} );
}
