/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	isReusableBlock,
	createBlock,
	parse,
	serialize,
} from '@wordpress/blocks';
import { createRegistryControl } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as reusableBlocksStore } from './index.js';

/**
 * Convert a reusable block to a static block effect handler
 *
 * @param {string}  clientId Block ID.
 * @return {Object} control descriptor.
 */
export function convertBlockToStatic( clientId ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		clientId,
	};
}

/**
 * Convert a static block to a reusable block effect handler
 *
 * @param {Array} clientIds Block IDs.
 * @param {string} title    Reusable block title.
 * @return {Object} control descriptor.
 */
export function convertBlocksToReusable( clientIds, title ) {
	return {
		type: 'CONVERT_BLOCKS_TO_REUSABLE',
		clientIds,
		title,
	};
}

/**
 * Deletes a reusable block.
 *
 * @param {string} id Reusable block ID.
 * @return {Object} control descriptor.
 */
export function deleteReusableBlock( id ) {
	return {
		type: 'DELETE_REUSABLE_BLOCK',
		id,
	};
}

const controls = {
	CONVERT_BLOCK_TO_STATIC: createRegistryControl(
		( registry ) => ( { clientId } ) => {
			const oldBlock = registry
				.select( blockEditorStore )
				.getBlock( clientId );
			const reusableBlock = registry
				.select( 'core' )
				.getEditedEntityRecord(
					'postType',
					'wp_block',
					oldBlock.attributes.ref
				);

			const newBlocks = parse(
				isFunction( reusableBlock.content )
					? reusableBlock.content( reusableBlock )
					: reusableBlock.content
			);
			registry
				.dispatch( blockEditorStore )
				.replaceBlocks( oldBlock.clientId, newBlocks );
		}
	),

	CONVERT_BLOCKS_TO_REUSABLE: createRegistryControl(
		( registry ) =>
			async function ( { clientIds, title } ) {
				const reusableBlock = {
					title: title || __( 'Untitled Reusable block' ),
					content: serialize(
						registry
							.select( blockEditorStore )
							.getBlocksByClientId( clientIds )
					),
					status: 'publish',
				};

				const updatedRecord = await registry
					.dispatch( 'core' )
					.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

				const newBlock = createBlock( 'core/block', {
					ref: updatedRecord.id,
				} );
				registry
					.dispatch( blockEditorStore )
					.replaceBlocks( clientIds, newBlock );
				registry
					.dispatch( reusableBlocksStore )
					.__experimentalSetEditingReusableBlock(
						newBlock.clientId,
						true
					);
			}
	),

	DELETE_REUSABLE_BLOCK: createRegistryControl(
		( registry ) =>
			async function ( { id } ) {
				const reusableBlock = registry
					.select( 'core' )
					.getEditedEntityRecord( 'postType', 'wp_block', id );

				// Don't allow a reusable block with a temporary ID to be deleted
				if ( ! reusableBlock ) {
					return;
				}

				// Remove any other blocks that reference this reusable block
				const allBlocks = registry
					.select( blockEditorStore )
					.getBlocks();
				const associatedBlocks = allBlocks.filter(
					( block ) =>
						isReusableBlock( block ) && block.attributes.ref === id
				);
				const associatedBlockClientIds = associatedBlocks.map(
					( block ) => block.clientId
				);

				// Remove the parsed block.
				if ( associatedBlockClientIds.length ) {
					registry
						.dispatch( blockEditorStore )
						.removeBlocks( associatedBlockClientIds );
				}

				await registry
					.dispatch( 'core' )
					.deleteEntityRecord( 'postType', 'wp_block', id );
			}
	),
};

export default controls;
