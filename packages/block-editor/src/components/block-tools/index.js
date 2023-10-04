/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Popover,
	Fill,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { useRef } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	InsertionPointOpenRef,
	default as InsertionPoint,
} from './insertion-point';
import { store as blockEditorStore } from '../../store';
import usePopoverScroll from '../block-popover/use-popover-scroll';
import ZoomOutModeInserters from './zoom-out-mode-inserters';
import EmptyBlockInserter from './empty-block-inserter';
import SelectedBlockTools from './selected-block-tools';

function selector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getBlock,
		__unstableGetEditorMode,
		isTyping,
	} = select( blockEditorStore );

	const clientId =
		getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

	const { name = '', attributes = {} } = getBlock( clientId ) || {};

	return {
		clientId,
		hasSelectedBlock: clientId && name,
		isTyping: isTyping(),
		isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		showEmptyBlockSideInserter:
			clientId &&
			! isTyping() &&
			__unstableGetEditorMode() === 'edit' &&
			isUnmodifiedDefaultBlock( { name, attributes } ),
	};
}

/**
 * Renders block tools (the block toolbar, select/navigation mode toolbar, the
 * insertion point and a slot for the inline rich text toolbar). Must be wrapped
 * around the block content and editor styles wrapper or iframe.
 *
 * @param {Object} $0                      Props.
 * @param {Object} $0.children             The block content and style container.
 * @param {Object} $0.__unstableContentRef Ref holding the content scroll container.
 */
export default function BlockTools( {
	children,
	__unstableContentRef,
	...props
} ) {
	const {
		clientId,
		hasSelectedBlock,
		isTyping,
		isZoomOutMode,
		showEmptyBlockSideInserter,
	} = useSelect( selector, [] );
	const isMatch = useShortcutEventMatch();
	const { getSelectedBlockClientIds, getBlockRootClientId } =
		useSelect( blockEditorStore );

	const blockToolbarRef = usePopoverScroll( __unstableContentRef );

	// TODO: Import this from somewhere so it can be used in the post editor and site editor headers consistently.
	const selectedBlockToolsSlotName = '__experimentalSelectedBlockTools';
	const blockToolsSlot = useSlot( selectedBlockToolsSlotName );

	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		clearSelectedBlock,
		selectBlock,
		moveBlocksUp,
		moveBlocksDown,
	} = useDispatch( blockEditorStore );

	function onKeyDown( event ) {
		if ( event.defaultPrevented ) return;

		if ( isMatch( 'core/block-editor/move-up', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
				moveBlocksUp( clientIds, rootClientId );
			}
		} else if ( isMatch( 'core/block-editor/move-down', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
				moveBlocksDown( clientIds, rootClientId );
			}
		} else if ( isMatch( 'core/block-editor/duplicate', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				duplicateBlocks( clientIds );
			}
		} else if ( isMatch( 'core/block-editor/remove', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				removeBlocks( clientIds );
			}
		} else if ( isMatch( 'core/block-editor/insert-after', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				insertAfterBlock( clientIds[ clientIds.length - 1 ] );
			}
		} else if ( isMatch( 'core/block-editor/insert-before', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				insertBeforeBlock( clientIds[ 0 ] );
			}
		} else if ( isMatch( 'core/block-editor/unselect', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();

				// If there is more than one block selected, select the first
				// block so that focus is directed back to the beginning of the selection.
				// In effect, to the user this feels like deselecting the multi-selection.
				if ( clientIds.length > 1 ) {
					selectBlock( clientIds[ 0 ] );
				} else {
					clearSelectedBlock();
				}
				event.target.ownerDocument.defaultView
					.getSelection()
					.removeAllRanges();
				__unstableContentRef?.current.focus();
			}
		}
	}

	const blockToolbarAfterRef = usePopoverScroll( __unstableContentRef );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div { ...props } onKeyDown={ onKeyDown }>
			<InsertionPointOpenRef.Provider value={ useRef( false ) }>
				{ ! isTyping && (
					<InsertionPoint
						__unstableContentRef={ __unstableContentRef }
					/>
				) }
				{ showEmptyBlockSideInserter && (
					<EmptyBlockInserter
						__unstableContentRef={ __unstableContentRef }
						clientId={ clientId }
					/>
				) }

				{ /* If there is no slot available, such as in the standalone block editor, render within the editor */ }
				{ blockToolsSlot?.ref?.current ? (
					<Fill name="__experimentalSelectedBlockTools">
						{ hasSelectedBlock && (
							<SelectedBlockTools
								clientId={ clientId }
								showEmptyBlockSideInserter={
									showEmptyBlockSideInserter
								}
							/>
						) }
						{ /* Used for the inline rich text toolbar. */ }
						<Popover.Slot
							name="block-toolbar"
							ref={ blockToolbarRef }
						/>
					</Fill>
				) : (
					<>
						{ hasSelectedBlock && (
							<SelectedBlockTools
								clientId={ clientId }
								showEmptyBlockSideInserter={
									showEmptyBlockSideInserter
								}
							/>
						) }
						{ /* Used for the inline rich text toolbar. */ }
						<Popover.Slot
							name="block-toolbar"
							ref={ blockToolbarRef }
						/>
					</>
				) }

				{ children }
				{ /* Used for inline rich text popovers. */ }
				<Popover.Slot
					name="__unstable-block-tools-after"
					ref={ blockToolbarAfterRef }
				/>
				{ isZoomOutMode && (
					<ZoomOutModeInserters
						__unstableContentRef={ __unstableContentRef }
					/>
				) }
			</InsertionPointOpenRef.Provider>
		</div>
	);
}
