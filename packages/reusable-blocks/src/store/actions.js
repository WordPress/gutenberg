/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	isReusableBlock,
	parse,
	serialize,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Returns a generator converting a reusable block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
export const __experimentalConvertBlockToStatic =
	( clientId ) =>
	( { registry } ) => {
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
			typeof reusableBlock.content === 'function'
				? reusableBlock.content( reusableBlock )
				: reusableBlock.content
		);
		registry
			.dispatch( blockEditorStore )
			.replaceBlocks( oldBlock.clientId, newBlocks );
	};

/**
 * Returns a generator converting one or more static blocks into a pattern.
 *
 * @param {string[]}           clientIds The client IDs of the block to detach.
 * @param {string}             title     Pattern title.
 * @param {'fully'|'unsynced'} syncType  They way block is synced, current 'fully' and 'unsynced'.
 */
export const __experimentalConvertBlocksToReusable =
	( clientIds, title, syncType ) =>
	async ( { registry, dispatch } ) => {
		const meta =
			syncType === 'unsynced'
				? {
						sync_status: syncType,
				  }
				: undefined;

		const reusableBlock = {
			title: title || __( 'Untitled Pattern block' ),
			content: serialize(
				registry
					.select( blockEditorStore )
					.getBlocksByClientId( clientIds )
			),
			status: 'publish',
			meta,
		};

		const updatedRecord = await registry
			.dispatch( 'core' )
			.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

		if ( syncType === 'unsynced' ) {
			return;
		}

		const newBlock = createBlock( 'core/block', {
			ref: updatedRecord.id,
		} );
		registry
			.dispatch( blockEditorStore )
			.replaceBlocks( clientIds, newBlock );
		dispatch.__experimentalSetEditingReusableBlock(
			newBlock.clientId,
			true
		);
	};

/**
 * Returns a generator deleting a reusable block.
 *
 * @param {string} id The ID of the reusable block to delete.
 */
export const __experimentalDeleteReusableBlock =
	( id ) =>
	async ( { registry } ) => {
		const reusableBlock = registry
			.select( 'core' )
			.getEditedEntityRecord( 'postType', 'wp_block', id );

		// Don't allow a reusable block with a temporary ID to be deleted.
		if ( ! reusableBlock ) {
			return;
		}

		// Remove any other blocks that reference this reusable block.
		const allBlocks = registry.select( blockEditorStore ).getBlocks();
		const associatedBlocks = allBlocks.filter(
			( block ) => isReusableBlock( block ) && block.attributes.ref === id
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
	};

/**
 * Returns an action descriptor for SET_EDITING_REUSABLE_BLOCK action.
 *
 * @param {string}  clientId  The clientID of the reusable block to target.
 * @param {boolean} isEditing Whether the block should be in editing state.
 * @return {Object} Action descriptor.
 */
export function __experimentalSetEditingReusableBlock( clientId, isEditing ) {
	return {
		type: 'SET_EDITING_REUSABLE_BLOCK',
		clientId,
		isEditing,
	};
}
