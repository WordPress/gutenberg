/**
 * External dependencies
 */
import { castArray, first, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	hasBlockSupport,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useNotifyCopy } from '../copy-handler';
import { store as blockEditorStore } from '../../store';

export default function BlockActions( {
	clientIds,
	children,
	__experimentalUpdateSelection: updateSelection,
} ) {
	const {
		canInsertBlockType,
		getBlockRootClientId,
		getBlocksByClientId,
		canMoveBlocks,
		canRemoveBlocks,
	} = useSelect( blockEditorStore );
	const { getDefaultBlockName, getGroupingBlockName } = useSelect(
		blocksStore
	);

	const blocks = getBlocksByClientId( clientIds );
	const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
	const canDuplicate = every( blocks, ( block ) => {
		return (
			!! block &&
			hasBlockSupport( block.name, 'multiple', true ) &&
			canInsertBlockType( block.name, rootClientId )
		);
	} );

	const canInsertDefaultBlock = canInsertBlockType(
		getDefaultBlockName(),
		rootClientId
	);

	const canMove = canMoveBlocks( clientIds, rootClientId );
	const canRemove = canRemoveBlocks( clientIds, rootClientId );

	const {
		removeBlocks,
		replaceBlocks,
		duplicateBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		flashBlock,
		setBlockMovingClientId,
		setNavigationMode,
		selectBlock,
	} = useDispatch( blockEditorStore );

	const notifyCopy = useNotifyCopy();

	return children( {
		canDuplicate,
		canInsertDefaultBlock,
		canMove,
		canRemove,
		rootClientId,
		blocks,
		onDuplicate() {
			return duplicateBlocks( clientIds, updateSelection );
		},
		onRemove() {
			return removeBlocks( clientIds, updateSelection );
		},
		onInsertBefore() {
			insertBeforeBlock( first( castArray( clientIds ) ) );
		},
		onInsertAfter() {
			insertAfterBlock( last( castArray( clientIds ) ) );
		},
		onMoveTo() {
			setNavigationMode( true );
			selectBlock( clientIds[ 0 ] );
			setBlockMovingClientId( clientIds[ 0 ] );
		},
		onGroup() {
			if ( ! blocks.length ) {
				return;
			}

			const groupingBlockName = getGroupingBlockName();

			// Activate the `transform` on `core/group` which does the conversion.
			const newBlocks = switchToBlockType( blocks, groupingBlockName );

			if ( ! newBlocks ) {
				return;
			}
			replaceBlocks( clientIds, newBlocks );
		},
		onUngroup() {
			if ( ! blocks.length ) {
				return;
			}

			const innerBlocks = blocks[ 0 ].innerBlocks;

			if ( ! innerBlocks.length ) {
				return;
			}

			replaceBlocks( clientIds, innerBlocks );
		},
		onCopy() {
			const selectedBlockClientIds = blocks.map(
				( { clientId } ) => clientId
			);
			if ( blocks.length === 1 ) {
				flashBlock( selectedBlockClientIds[ 0 ] );
			}
			notifyCopy( 'copy', selectedBlockClientIds );
		},
	} );
}
