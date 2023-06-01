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
import usePasteStyles from '../use-paste-styles';
import { store as blockEditorStore } from '../../store';
import { showBlockRemovalWarning } from '../../utils/show-block-removal-warning';

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
		getBlockName,
	} = useSelect( blockEditorStore );
	const { getDefaultBlockName, getGroupingBlockName } =
		useSelect( blocksStore );

	const blocks = getBlocksByClientId( clientIds );
	const rootClientId = getBlockRootClientId( clientIds[ 0 ] );

	const canCopyStyles = blocks.every( ( block ) => {
		return (
			!! block &&
			( hasBlockSupport( block.name, 'color' ) ||
				hasBlockSupport( block.name, 'typography' ) )
		);
	} );

	const canDuplicate = blocks.every( ( block ) => {
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
		displayRemovalPrompt,
	} = useDispatch( blockEditorStore );

	const notifyCopy = useNotifyCopy();
	const pasteStyles = usePasteStyles();

	return children( {
		canCopyStyles,
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
			const shouldDisplayRemovalPrompt = clientIds
				.map( ( blockClientId ) =>
					showBlockRemovalWarning( getBlockName( blockClientId ) )
				)
				.filter( ( blockName ) => blockName );
			if ( shouldDisplayRemovalPrompt.length ) {
				displayRemovalPrompt( true, {
					removalFunction: () => {
						removeBlocks( clientIds, updateSelection );
					},
					blockName: shouldDisplayRemovalPrompt[ 0 ],
				} );
			} else {
				removeBlocks( clientIds, updateSelection );
			}
		},
		onInsertBefore() {
			const clientId = Array.isArray( clientIds )
				? clientIds[ 0 ]
				: clientId;
			insertBeforeBlock( clientId );
		},
		onInsertAfter() {
			const clientId = Array.isArray( clientIds )
				? clientIds[ clientIds.length - 1 ]
				: clientId;
			insertAfterBlock( clientId );
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
		async onPasteStyles() {
			await pasteStyles( blocks );
		},
	} );
}
