/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { DELETE, LEFT, RIGHT, UP, DOWN, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import InsertionPoint from './insertion-point';
import BlockPopover from './block-popover';
import { store as blockEditorStore } from '../../store';
import BlockContextualToolbar from './block-contextual-toolbar';
import { usePopoverScroll } from './use-popover-scroll';

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
	const isLargeViewport = useViewportMatch( 'medium' );
	const hasFixedToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasFixedToolbar,
		[]
	);
	const isMatch = useShortcutEventMatch();
	const { getSelectedBlockClientIds, getBlockRootClientId } = useSelect(
		blockEditorStore
	);
	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		clearSelectedBlock,
		moveBlocksUp,
		moveBlocksDown,
		deleteSelection,
	} = useDispatch( blockEditorStore );

	function onKeyDown( event ) {
		const clientIds = getSelectedBlockClientIds();

		if ( ! clientIds.length ) return;

		if ( isMatch( 'core/block-editor/move-up', event ) ) {
			event.preventDefault();
			const rootClientId = getBlockRootClientId( first( clientIds ) );
			moveBlocksUp( clientIds, rootClientId );
		} else if ( isMatch( 'core/block-editor/move-down', event ) ) {
			event.preventDefault();
			const rootClientId = getBlockRootClientId( first( clientIds ) );
			moveBlocksDown( clientIds, rootClientId );
		} else if ( isMatch( 'core/block-editor/duplicate', event ) ) {
			event.preventDefault();
			duplicateBlocks( clientIds );
		} else if ( isMatch( 'core/block-editor/remove', event ) ) {
			event.preventDefault();
			removeBlocks( clientIds );
		} else if ( isMatch( 'core/block-editor/insert-after', event ) ) {
			event.preventDefault();
			insertAfterBlock( last( clientIds ) );
		} else if ( isMatch( 'core/block-editor/insert-before', event ) ) {
			event.preventDefault();
			insertBeforeBlock( first( clientIds ) );
		}

		/**
		 * Check if the target element is a text area, input or
		 * event.defaultPrevented and return early. In all these
		 * cases backspace could be handled elsewhere.
		 */
		if (
			[ 'INPUT', 'TEXTAREA' ].includes( event.target.nodeName ) ||
			event.defaultPrevented
		) {
			return;
		}

		if ( clientIds.length === 1 ) {
			return;
		}

		if ( isMatch( 'core/block-editor/delete-multi-selection', event ) ) {
			const isForward = event.keyCode === DELETE;
			deleteSelection( isForward );
			event.preventDefault();
		} else if ( isMatch( 'core/block-editor/unselect', event ) ) {
			event.preventDefault();
			clearSelectedBlock();
			event.target.ownerDocument.defaultView
				.getSelection()
				.removeAllRanges();
		}

		if (
			event.keyCode === UP ||
			event.keyCode === DOWN ||
			event.keyCode === LEFT ||
			event.keyCode === RIGHT ||
			event.keyCode === TAB
		) {
			return;
		}

		event.preventDefault();
	}

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div { ...props } onKeyDown={ onKeyDown }>
			<InsertionPoint __unstableContentRef={ __unstableContentRef }>
				{ ( hasFixedToolbar || ! isLargeViewport ) && (
					<BlockContextualToolbar isFixed />
				) }
				{ /* Even if the toolbar is fixed, the block popover is still
                 needed for navigation mode. */ }
				<BlockPopover __unstableContentRef={ __unstableContentRef } />
				{ /* Used for the inline rich text toolbar. */ }
				<Popover.Slot
					name="block-toolbar"
					ref={ usePopoverScroll( __unstableContentRef ) }
				/>
				{ children }
				{ /* Used for inline rich text popovers. */ }
				<Popover.Slot
					name="__unstable-block-tools-after"
					ref={ usePopoverScroll( __unstableContentRef ) }
				/>
			</InsertionPoint>
		</div>
	);
}
