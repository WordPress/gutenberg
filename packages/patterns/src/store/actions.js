/**
 * WordPress dependencies
 */

import { parse, serialize, createBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Returns a generator converting one or more static blocks into a pattern, or creating a new empty pattern.
 *
 * @param {string}             title     Pattern title.
 * @param {'full'|'unsynced'}  syncType  They way block is synced, 'full' or 'unsynced'.
 * @param {string[]|undefined} clientIds Optional client IDs of blocks to convert to pattern.
 */
export const __experimentalCreatePattern =
	( title, syncType, clientIds ) =>
	async ( { registry, dispatch } ) => {
		const meta =
			syncType === 'unsynced'
				? {
						wp_pattern_sync_status: syncType,
				  }
				: undefined;

		const reusableBlock = {
			title,
			content: clientIds
				? serialize(
						registry
							.select( blockEditorStore )
							.getBlocksByClientId( clientIds )
				  )
				: undefined,
			status: 'publish',
			meta,
		};

		const updatedRecord = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

		if ( syncType === 'unsynced' || ! clientIds ) {
			return updatedRecord;
		}

		const newBlock = createBlock( 'core/block', {
			ref: updatedRecord.id,
		} );
		registry
			.dispatch( blockEditorStore )
			.replaceBlocks( clientIds, newBlock );
		dispatch.__experimentalSetEditingPattern( newBlock.clientId, true );
		return updatedRecord;
	};

/**
 * Returns a generator converting a synced pattern block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
export const __experimentalConvertSyncedPatternToStatic =
	( clientId ) =>
	( { registry } ) => {
		const oldBlock = registry
			.select( blockEditorStore )
			.getBlock( clientId );
		const pattern = registry
			.select( 'core' )
			.getEditedEntityRecord(
				'postType',
				'wp_block',
				oldBlock.attributes.ref
			);

		const newBlocks = parse(
			typeof pattern.content === 'function'
				? pattern.content( pattern )
				: pattern.content
		);
		registry
			.dispatch( blockEditorStore )
			.replaceBlocks( oldBlock.clientId, newBlocks );
	};

/**
 * Returns an action descriptor for SET_EDITING_PATTERN action.
 *
 * @param {string}  clientId  The clientID of the pattern to target.
 * @param {boolean} isEditing Whether the block should be in editing state.
 * @return {Object} Action descriptor.
 */
export function __experimentalSetEditingPattern( clientId, isEditing ) {
	return {
		type: 'SET_EDITING_PATTERN',
		clientId,
		isEditing,
	};
}
