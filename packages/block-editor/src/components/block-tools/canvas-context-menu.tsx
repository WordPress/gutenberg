import type { MouseEvent } from 'react';
import { useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { BlockSettingsDropdown } from '../block-settings-menu/block-settings-dropdown';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Elements whose own context menu carries actions the block Options menu has
 * no equivalent for, such as saving or opening the file.
 */
const MEDIA_SELECTOR = 'img, video, audio, object, embed';

/**
 * The right-click a menu is open for.
 */
type CanvasContextMenuState = {
	/** The blocks the menu acts on. */
	clientIds: string[];
	/** Places the menu at the cursor. */
	anchor: { getBoundingClientRect: () => DOMRect };
};

/**
 * Gives the cursor position in the coordinate space of the document the menu
 * renders in. A click in the iframed canvas reports coordinates relative to
 * the iframe, so the frame's own position is added, as `bubbleEvent` does for
 * the events it forwards out of the iframe.
 *
 * @param event  The right-click.
 * @param target The element that was right-clicked.
 */
function getCursorAnchor( event: MouseEvent, target: Element ) {
	const frame = target.ownerDocument.defaultView?.frameElement;
	const { left, top } = frame
		? frame.getBoundingClientRect()
		: { left: 0, top: 0 };
	const x = event.clientX + left;
	const y = event.clientY + top;

	return {
		getBoundingClientRect: () => new window.DOMRect( x, y, 0, 0 ),
	};
}

/**
 * Opens the block Options menu where a block in the canvas is right-clicked,
 * as right-clicking a List View row does.
 */
export function useCanvasContextMenu() {
	const [ menu, setMenu ] = useState< CanvasContextMenuState | null >( null );
	const { allowRightClickOverrides, isZoomOut } = useSelect( ( select ) => {
		const { getSettings, isZoomOut: _isZoomOut } = unlock(
			select( blockEditorStore )
		);
		return {
			allowRightClickOverrides: !! getSettings().allowRightClickOverrides,
			isZoomOut: _isZoomOut(),
		};
	}, [] );
	const {
		canEditBlock,
		getBlockEditingMode,
		getSelectedBlockClientIds,
		getSelectionStart,
		getSelectionEnd,
	} = unlock( useSelect( blockEditorStore ) );
	const { selectBlock } = useDispatch( blockEditorStore );

	// What a right-click on this target means, for the two handlers that have
	// to agree on it.
	const resolve = useCallback(
		( target: Element ) => {
			if ( ! allowRightClickOverrides || isZoomOut ) {
				return undefined;
			}

			const clientId =
				target.closest< HTMLElement >( '[data-block]' )?.dataset.block;

			if (
				! clientId ||
				! canEditBlock( clientId ) ||
				getBlockEditingMode( clientId ) !== 'default'
			) {
				return undefined;
			}

			// A click within a selection of blocks acts on the whole selection,
			// as it does in the List View.
			//
			// A text selection reaching into another block is a multi-selection
			// too, and there the browser's menu is still the useful one, so
			// `hasMultiSelection` does not tell the two apart. A selection of
			// blocks is the one with no text offsets to its ends.
			const selectedClientIds = getSelectedBlockClientIds();
			const isWithinBlockSelection =
				selectedClientIds.length > 1 &&
				selectedClientIds.includes( clientId ) &&
				getSelectionStart().attributeKey === undefined &&
				getSelectionEnd().attributeKey === undefined;

			// Leave the browser's own menu in place wherever it carries editing
			// controls the Options menu cannot replace: text keeps cut, paste,
			// spelling and dictation, and media keeps saving and opening the
			// file. Blocks selected as blocks are not being edited as text, so
			// the browser's menu has nothing to add to them.
			if (
				! isWithinBlockSelection &&
				( target.closest( '[contenteditable="true"]' ) ||
					target.closest( MEDIA_SELECTOR ) )
			) {
				return undefined;
			}

			return { clientId, selectedClientIds, isWithinBlockSelection };
		},
		[
			allowRightClickOverrides,
			canEditBlock,
			getBlockEditingMode,
			getSelectedBlockClientIds,
			getSelectionEnd,
			getSelectionStart,
			isZoomOut,
		]
	);

	const onMouseDown = useCallback(
		( event: MouseEvent ) => {
			// The secondary button places the caret too, which would collapse
			// a selection of blocks to the clicked one while its own menu is
			// opening. Preventing that default keeps the selection the menu
			// was aimed at, as the List View does for the same reason. The
			// default is left alone everywhere else, so an ordinary
			// right-click still places the caret for the browser's own menu.
			if (
				event.button === 2 &&
				resolve( event.target as Element )?.isWithinBlockSelection
			) {
				event.preventDefault();
			}
		},
		[ resolve ]
	);

	const onContextMenu = useCallback(
		( event: MouseEvent ) => {
			if ( event.defaultPrevented ) {
				return;
			}

			const target = event.target as Element;
			const resolved = resolve( target );

			if ( ! resolved ) {
				return;
			}

			const { clientId, selectedClientIds, isWithinBlockSelection } =
				resolved;

			if ( ! isWithinBlockSelection ) {
				// Without an initial position the block is selected but not
				// focused, leaving the focus for the menu that is about to
				// open, as the List View does.
				selectBlock( clientId, null );
			}

			event.preventDefault();
			setMenu( {
				clientIds: isWithinBlockSelection
					? selectedClientIds
					: [ clientId ],
				anchor: getCursorAnchor( event, target ),
			} );
		},
		[ resolve, selectBlock ]
	);

	const closeMenu = useCallback( () => setMenu( null ), [] );

	return { onContextMenu, onMouseDown, menu, closeMenu };
}

/**
 * A `DropdownMenu` opens from a toggle button, while this menu opens from the
 * right-click and is anchored to the cursor, so the toggle renders nothing.
 */
function NoToggle() {
	return null;
}

/**
 * Renders the block Options menu at the cursor.
 *
 * @param props
 * @param props.menu    The right-click the menu is open for.
 * @param props.onClose Closes the menu.
 */
export function CanvasContextMenu( {
	menu,
	onClose,
}: {
	menu: CanvasContextMenuState;
	onClose: () => void;
} ) {
	return (
		<BlockSettingsDropdown
			clientIds={ menu.clientIds }
			open
			onToggle={ ( isOpen: boolean ) => {
				if ( ! isOpen ) {
					onClose();
				}
			} }
			popoverProps={ {
				anchor: menu.anchor,
				className: 'block-editor-block-settings-menu__popover',
				placement: 'bottom-start',
			} }
			toggleProps={ { as: NoToggle } }
		/>
	);
}
