/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { SELECTION_CHECKBOX_CLASS } from '../../dataviews-selection-checkbox';
import { hasAPossibleBulkAction } from '../../dataviews-bulk-actions';
import type { Action } from '../../../types';
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
	 * The id of the item the previous consecutive Shift+Click ended at. It is
	 * one end of the range that click selected and the anchor is the other,
	 * and that range is the one this click replaces. `null` when no range has
	 * been selected since the anchor was set.
	 */
	lastTargetId: string | null;
	/**
	 * The ids of all selectable items, in render order.
	 */
	orderedIds: string[];
	/**
	 * The current selection.
	 */
	selection: string[];
}

function getRange(
	orderedIds: string[],
	fromIndex: number,
	toIndex: number
): string[] {
	return orderedIds.slice(
		Math.min( fromIndex, toIndex ),
		Math.max( fromIndex, toIndex ) + 1
	);
}

// Computes the new selection for a Shift+Click range gesture: the contiguous
// run of `orderedIds` between the anchor and the target, inclusive, is
// selected, replacing the run the previous consecutive Shift+Click selected.
// The anchor stays put across consecutive Shift+Clicks, so reversing direction
// redefines the range from the anchor rather than starting a new one, and
// moving the target back towards the anchor shrinks it. Only the previous
// range is discarded, so items selected outside of it survive. The range
// is never subtractive: Shift+Clicking a selected item leaves it selected.
// When the anchor is missing or no longer present in `orderedIds`, the range
// starts at the target.
export function getRangeSelection( {
	anchorId,
	targetId,
	lastTargetId,
	orderedIds,
	selection,
}: RangeSelectionArgs ): string[] {
	const targetIndex = orderedIds.indexOf( targetId );
	if ( targetIndex === -1 ) {
		return selection;
	}

	const anchorIndex = anchorId === null ? -1 : orderedIds.indexOf( anchorId );
	const hasAnchor = anchorIndex !== -1;
	const rangeStart = hasAnchor ? anchorIndex : targetIndex;

	// Without an anchor the previous range can't be reconstructed, so the
	// gesture starts afresh at the target rather than discarding a guess.
	const lastTargetIndex =
		hasAnchor && lastTargetId !== null
			? orderedIds.indexOf( lastTargetId )
			: -1;
	const lastRange =
		lastTargetIndex === -1
			? []
			: getRange( orderedIds, rangeStart, lastTargetIndex );

	const base = selection.filter( ( id ) => ! lastRange.includes( id ) );

	return [
		...new Set( [
			...base,
			...getRange( orderedIds, rangeStart, targetIndex ),
		] ),
	];
}

// The selected item nearest the target in `orderedIds`, or `null` when none
// is selected. Used to infer an anchor for a Shift+Click that has none: a
// selection restored from elsewhere (e.g. the URL) carries no anchor, so the
// item to extend the range from has to be guessed, and the nearest selected
// one is the guess a user can predict. Ties resolve to the earlier item.
export function getClosestSelectedId( {
	targetId,
	orderedIds,
	selection,
}: {
	targetId: string;
	orderedIds: string[];
	selection: string[];
} ): string | null {
	const targetIndex = orderedIds.indexOf( targetId );
	if ( targetIndex === -1 ) {
		return null;
	}

	const selectedIds = new Set( selection );
	let closestId: string | null = null;
	let closestDistance = Infinity;
	orderedIds.forEach( ( id, index ) => {
		if ( ! selectedIds.has( id ) ) {
			return;
		}
		const distance = Math.abs( index - targetIndex );
		if ( distance < closestDistance ) {
			closestDistance = distance;
			closestId = id;
		}
	} );

	return closestId;
}

export interface SelectionProps {
	onMouseDown: ( event: React.MouseEvent ) => void;
	onClickCapture: ( event: React.MouseEvent ) => void;
}

// Encapsulates the pointer gestures for multi-selection, shared by layouts:
// Ctrl/Cmd+Click toggles an item, and Shift+Click selects the range between
// the anchor (the last item whose selection was directly toggled) and the
// clicked item, leaving the selection outside the range untouched.
//
// Layouts pass `data` in the order they render it, along with `actions` and
// `getItemId`; the hook derives the selectable items itself (those with a
// possible bulk action) so every layout doesn't repeat that logic. Spread
// `getSelectionProps( id )` on each item's container element.
//
// The selection model is one-dimensional: a range is the contiguous run of
// selectable items between the anchor and the target. Two-dimensional layouts
// (e.g. the grid) pass their items flattened to reading order, so a
// Shift+Click range follows that order rather than a rectangular block of
// rows and columns.
//
// Clicks with a modifier are intercepted during the capture phase, before
// inner clickable elements (item links, checkboxes) can handle them. When no
// item in the view is selectable the gestures are inert and clicks fall
// through to inner elements. Layout-specific concerns don't belong here:
// layouts wrap the returned handlers to compose extra behavior ad-hoc.
export default function useSelectionProps< Item >( {
	data,
	actions,
	getItemId,
	selection,
	onChangeSelection,
}: {
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	selection: string[];
	onChangeSelection: SetSelection;
} ) {
	// The Shift+Click range gesture in progress: the anchor ranges extend from
	// — the last item whose selection was directly toggled — and the target of
	// the last Shift+Click, which is the other end of the range currently
	// selected. A target only means something alongside the anchor that
	// selected it, so the two are stored together. Kept in a ref as it doesn't
	// affect rendering.
	const gestureRef = useRef< {
		anchorId: string;
		lastTargetId: string | null;
	} | null >( null );
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

	// The ids of all selectable items — those with a possible bulk action —
	// in the order the layout renders them; ranges follow this order.
	const selectableIds = data
		.filter( ( item ) => hasAPossibleBulkAction( actions, item ) )
		.map( getItemId );
	const selectableIdSet = new Set( selectableIds );
	const hasSelectableItems = selectableIds.length > 0;

	const getSelectionProps = ( id: string ): SelectionProps => {
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
					// it in the checkbox's own handler; it only anchors a new
					// gesture here.
					if ( isSelectable && isSelectionCheckboxClick ) {
						gestureRef.current = {
							anchorId: id,
							lastTargetId: null,
						};
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
					let gesture = gestureRef.current;
					if (
						! gesture ||
						! selectableIdSet.has( gesture.anchorId )
					) {
						// Without a usable anchor, start a gesture from the
						// selected item nearest the target, falling back to
						// the target itself when nothing is selected.
						gesture = {
							anchorId:
								getClosestSelectedId( {
									targetId: id,
									orderedIds: selectableIds,
									selection,
								} ) ?? id,
							lastTargetId: null,
						};
					}
					onChangeSelection(
						getRangeSelection( {
							anchorId: gesture.anchorId,
							targetId: id,
							lastTargetId: gesture.lastTargetId,
							orderedIds: selectableIds,
							selection,
						} )
					);
					// The anchor stays put so a subsequent Shift+Click
					// redefines the range rather than extending from here.
					gestureRef.current = {
						anchorId: gesture.anchorId,
						lastTargetId: id,
					};
				} else {
					// Handle non-consecutive selection with Ctrl/Cmd+Click.
					onChangeSelection(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
					);
					gestureRef.current = { anchorId: id, lastTargetId: null };
				}
			},
		};
	};

	return { getSelectionProps };
}
