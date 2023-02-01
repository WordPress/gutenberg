/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	InsertionPointOpenRef,
	default as InsertionPoint,
} from './insertion-point';
import SelectedBlockPopover from './selected-block-popover';
import { store as blockEditorStore } from '../../store';
import BlockContextualToolbar from './block-contextual-toolbar';
import usePopoverScroll from '../block-popover/use-popover-scroll';
import ZoomOutModeInserters from './zoom-out-mode-inserters';

function selector( select ) {
	const { __unstableGetEditorMode, getSettings, isTyping } =
		select( blockEditorStore );

	return {
		isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		hasFixedToolbar: getSettings().hasFixedToolbar,
		isTyping: isTyping(),
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
	const isLargeViewport = useViewportMatch( 'medium' );
	const { hasFixedToolbar, isZoomOutMode, isTyping } = useSelect(
		selector,
		[]
	);
	const isMatch = useShortcutEventMatch();
	const { getSelectedBlockClientIds, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		clearSelectedBlock,
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
				clearSelectedBlock();
				event.target.ownerDocument.defaultView
					.getSelection()
					.removeAllRanges();
				__unstableContentRef?.current.focus();
			}
		}
	}

	const blockToolbarRef = usePopoverScroll( __unstableContentRef );
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
				{ ! isZoomOutMode &&
					( hasFixedToolbar || ! isLargeViewport ) && (
						<BlockContextualToolbar isFixed />
					) }
				{ /* Even if the toolbar is fixed, the block popover is still
					needed for navigation and zoom-out mode. */ }
				<SelectedBlockPopover
					__unstableContentRef={ __unstableContentRef }
				/>
				{ /* Used for the inline rich text toolbar. */ }
				<Popover.Slot name="block-toolbar" ref={ blockToolbarRef } />
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
