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
import { useNotifyCopy } from '../../utils/use-notify-copy';
import usePasteStyles from '../use-paste-styles';
import { store as blockEditorStore } from '../../store';

export default function BlockActions( {
	clientIds,
	children,
	__experimentalUpdateSelection: updateSelection,
} ) {
	const { getDefaultBlockName, getGroupingBlockName } =
		useSelect( blocksStore );
	const selected = useSelect(
		( select ) => {
			const {
				canInsertBlockType,
				getBlockRootClientId,
				getBlocksByClientId,
				getDirectInsertBlock,
				canMoveBlocks,
				canRemoveBlocks,
			} = select( blockEditorStore );

			const blocks = getBlocksByClientId( clientIds );
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const canInsertDefaultBlock = canInsertBlockType(
				getDefaultBlockName(),
				rootClientId
			);
			const directInsertBlock = rootClientId
				? getDirectInsertBlock( rootClientId )
				: null;

			return {
				canMove: canMoveBlocks( clientIds ),
				canRemove: canRemoveBlocks( clientIds ),
				canInsertBlock: canInsertDefaultBlock || !! directInsertBlock,
				canCopyStyles: blocks.every( ( block ) => {
					return (
						!! block &&
						( hasBlockSupport( block.name, 'color' ) ||
							hasBlockSupport( block.name, 'typography' ) )
					);
				} ),
				canDuplicate: blocks.every( ( block ) => {
					return (
						!! block &&
						hasBlockSupport( block.name, 'multiple', true ) &&
						canInsertBlockType( block.name, rootClientId )
					);
				} ),
			};
		},
		[ clientIds, getDefaultBlockName ]
	);
	const { getBlocksByClientId, getBlocks } = useSelect( blockEditorStore );

	const { canMove, canRemove, canInsertBlock, canCopyStyles, canDuplicate } =
		selected;

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
	const pasteStyles = usePasteStyles();

	return children( {
		canCopyStyles,
		canDuplicate,
		canInsertBlock,
		canMove,
		canRemove,
		onDuplicate() {
			return duplicateBlocks( clientIds, updateSelection );
		},
		onRemove() {
			return removeBlocks( clientIds, updateSelection );
		},
		onInsertBefore() {
			insertBeforeBlock( clientIds[ 0 ] );
		},
		onInsertAfter() {
			insertAfterBlock( clientIds[ clientIds.length - 1 ] );
		},
		onMoveTo() {
			setNavigationMode( true );
			selectBlock( clientIds[ 0 ] );
			setBlockMovingClientId( clientIds[ 0 ] );
		},
		onGroup() {
			if ( ! clientIds.length ) {
				return;
			}

			const groupingBlockName = getGroupingBlockName();

			// Activate the `transform` on `core/group` which does the conversion.
			const newBlocks = switchToBlockType(
				getBlocksByClientId( clientIds ),
				groupingBlockName
			);

			if ( ! newBlocks ) {
				return;
			}
			replaceBlocks( clientIds, newBlocks );
		},
		onUngroup() {
			if ( ! clientIds.length ) {
				return;
			}

			const innerBlocks = getBlocks( clientIds[ 0 ] );
			if ( ! innerBlocks.length ) {
				return;
			}

			replaceBlocks( clientIds, innerBlocks );
		},
		onCopy() {
			if ( clientIds.length === 1 ) {
				flashBlock( clientIds[ 0 ] );
			}
			notifyCopy( 'copy', clientIds );
		},
		async onPasteStyles() {
			await pasteStyles( getBlocksByClientId( clientIds ) );
		},
	} );
}
