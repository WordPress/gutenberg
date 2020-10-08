/**
 * WordPress dependencies
 */
import { createBlock, parse, serialize } from '@wordpress/blocks';
import { createRegistryControl } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

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
 * @param {Array}  clientIds Block IDs.
 * @return {Object} control descriptor.
 */
export function convertBlocksToReusable( clientIds ) {
	return {
		type: 'CONVERT_BLOCKS_TO_REUSABLE',
		clientIds,
	};
}

const controls = {
	CONVERT_BLOCK_TO_STATIC: createRegistryControl(
		( registry ) => ( { clientId } ) => {
			const oldBlock = registry
				.select( 'core/block-editor' )
				.getBlock( clientId );
			const reusableBlock = registry
				.select( 'core/block-editor' )
				.getEditedEntityRecord(
					'postType',
					'wp_block',
					oldBlock.attributes.ref
				);

			const newBlocks = parse( reusableBlock.content );
			registry
				.dispatch( 'core/block-editor' )
				.replaceBlocks( oldBlock.clientId, newBlocks );
		}
	),

	CONVERT_BLOCKS_TO_REUSABLE: createRegistryControl(
		( registry ) =>
			async function ( { clientIds } ) {
				const reusableBlock = {
					title: __( 'Untitled Reusable Block' ),
					content: serialize(
						registry
							.select( 'core/block-editor' )
							.getBlocksByClientId( clientIds )
					),
					status: 'publish',
				};

				const updatedRecord = await registry
					.dispatch( 'core' )
					.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

				registry.dispatch( 'core/block-editor' ).replaceBlocks(
					clientIds,
					createBlock( 'core/block', {
						ref: updatedRecord.id,
					} )
				);
			}
	),
};

export default controls;
