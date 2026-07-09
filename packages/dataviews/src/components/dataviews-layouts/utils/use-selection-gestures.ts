/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { SELECTION_CHECKBOX_CLASS } from '../../dataviews-selection-checkbox';
import type { SetSelection } from '../../../types/private';

interface RangeSelectionArgs {
	/**
	 * The id of the item the range starts from: the last item whose selection
	 * was directly toggled. `null` when no anchor has been set yet.
	 */
	anchorId: string | null;
	/**
	 * The id of the item that was Shift-clicked.
	 */
	targetId: string;
	/**
	 * The ids of all selectable items, in render order.
	 */
	orderedIds: string[];
	/**
	 * The current selection.
	 */
	selection: string[];
}

// Computes the new selection for a Shift+Click range gesture: the target is
// toggled and its new state is applied to the contiguous run of `orderedIds`
// between the anchor and the target, inclusive, leaving items outside the
// range untouched. Shift-clicking an unselected item thus selects the range,
// while shift-clicking a selected one deselects it. When the anchor is
// missing or no longer present in `orderedIds`, the gesture degrades to
// toggling the target.
export function getRangeSelection( {
	anchorId,
	targetId,
	orderedIds,
	selection,
}: RangeSelectionArgs ): string[] {
	const targetIndex = orderedIds.indexOf( targetId );
	if ( targetIndex === -1 ) {
		return selection;
	}

	let anchorIndex = anchorId === null ? -1 : orderedIds.indexOf( anchorId );
	if ( anchorIndex === -1 ) {
		anchorIndex = targetIndex;
	}

	const isSelecting = ! selection.includes( targetId );

	const range = orderedIds.slice(
		Math.min( anchorIndex, targetIndex ),
		Math.max( anchorIndex, targetIndex ) + 1
	);

	if ( ! isSelecting ) {
		return selection.filter( ( id ) => ! range.includes( id ) );
	}

	return [ ...new Set( [ ...selection, ...range ] ) ];
}

export interface SelectionGestureProps {
	onMouseDown: ( event: React.MouseEvent ) => void;
	onClickCapture: ( event: React.MouseEvent ) => void;
}

// Encapsulates the pointer gestures for multi-selection, shared by layouts:
// Ctrl/Cmd+Click toggles an item, and Shift+Click toggles it and applies its
// new state to the whole range between it and the anchor (the last item
// interacted with), leaving the selection outside the range untouched.
//
// Layouts decide which items are selectable and in which order they render:
// pass `selectableIds` — the ids of all selectable items in render order — and
// spread `getSelectionGestureProps( id )` on each item's container element.
//
// The selection model is one-dimensional: a range is the contiguous run of
// `selectableIds` between the anchor and the target. Two-dimensional layouts
// (e.g. the grid) pass their items flattened to reading order, so a
// Shift+Click range follows that order rather than a rectangular block of
// rows and columns.
//
// Clicks with a modifier are intercepted during the capture phase, before
// inner clickable elements (item links, checkboxes) can handle them. When no
// item in the view is selectable the gestures are inert and clicks fall
// through to inner elements. Layout-specific concerns don't belong here:
// layouts wrap the returned handlers to compose extra behavior ad-hoc.
export default function useSelectionGestures( {
	selectableIds,
	selection,
	onChangeSelection,
}: {
	selectableIds: string[];
	selection: string[];
	onChangeSelection: SetSelection;
} ) {
	// The anchor for Shift+Click ranges: the last item whose selection was
	// directly toggled. Kept in a ref as it doesn't affect rendering.
	const anchorRef = useRef< string | null >( null );
	// Set to true on the first `touchstart` anywhere in the document, and
	// used to exclude touchscreen devices from the modifier-click gestures.
	const isTouchDeviceRef = useRef( false );
	useEffect( () => {
		const markTouchDevice = () => {
			isTouchDeviceRef.current = true;
		};
		document.addEventListener( 'touchstart', markTouchDevice, {
			once: true,
		} );
		return () =>
			document.removeEventListener( 'touchstart', markTouchDevice );
	}, [] );

	const selectableIdSet = new Set( selectableIds );
	const hasSelectableItems = selectableIds.length > 0;

	const getSelectionGestureProps = ( id: string ): SelectionGestureProps => {
		const isSelectable = selectableIdSet.has( id );
		return {
			onMouseDown: ( event: React.MouseEvent ) => {
				// Prevent native text selection from swallowing the
				// Shift+Click range selection gesture.
				if (
					event.button === 0 &&
					event.shiftKey &&
					hasSelectableItems
				) {
					event.preventDefault();
				}
			},
			onClickCapture: ( event: React.MouseEvent ) => {
				if ( ! hasSelectableItems ) {
					return;
				}

				const isModifierKeyPressed = isAppleOS()
					? event.metaKey
					: event.ctrlKey;
				const isSelectionCheckboxClick =
					event.target instanceof Element &&
					!! event.target.closest( `.${ SELECTION_CHECKBOX_CLASS }` );

				if ( ! isModifierKeyPressed && ! event.shiftKey ) {
					// A plain click on the item's selection checkbox toggles
					// it in the checkbox's own handler; it only moves the
					// anchor here.
					if ( isSelectable && isSelectionCheckboxClick ) {
						anchorRef.current = id;
					}
					return;
				}

				if (
					isTouchDeviceRef.current ||
					document.getSelection()?.type === 'Range'
				) {
					return;
				}

				// Intercept the click before inner clickable elements can
				// handle (or the browser can act on) it: with a modifier
				// pressed the gesture is about selection. Non-selectable
				// items swallow it without changing the selection, so the
				// gesture behaves consistently across a view where only some
				// items are selectable.
				event.stopPropagation();
				// Except on the checkbox itself, whose native toggle always
				// matches the target's new state: cancelling it would revert
				// the input's checked state after React has re-rendered,
				// leaving the checkbox visually out of sync.
				if ( ! isSelectionCheckboxClick ) {
					event.preventDefault();
				}

				if ( ! isSelectable ) {
					return;
				}

				if ( event.shiftKey ) {
					onChangeSelection(
						getRangeSelection( {
							anchorId: anchorRef.current,
							targetId: id,
							orderedIds: selectableIds,
							selection,
						} )
					);
				} else {
					// Handle non-consecutive selection with Ctrl/Cmd+Click.
					onChangeSelection(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
					);
				}

				anchorRef.current = id;
			},
		};
	};

	return { getSelectionGestureProps };
}
