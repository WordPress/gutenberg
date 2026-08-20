import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Restores keyboard focus to the selected day when an externally triggered
 * month change unmounts the focused day button, which would otherwise drop
 * focus to the document body and strand keyboard and screen reader users.
 *
 * Returns a callback that records whether focus is inside the calendar's
 * day grid; call it right before a value change from outside the control
 * updates the displayed month. After the month renders, focus is moved to
 * the selected day, but only when the recorded focus was actually lost:
 * focus outside the day grid, e.g. on the input, a preset, or the month
 * navigation, is never touched.
 *
 * @param calendarRef   Ref to the calendar's root element.
 * @param calendarMonth The displayed calendar month.
 * @return Callback that records whether focus is inside the day grid.
 */
export default function useRestoreCalendarFocus(
	calendarRef: React.RefObject< HTMLDivElement | null >,
	calendarMonth: Date
) {
	const hadGridFocusRef = useRef( false );

	const markFocusForRestore = useCallback( () => {
		const grid = calendarRef.current?.querySelector( '[role="grid"]' );
		hadGridFocusRef.current =
			!! grid && grid.contains( grid.ownerDocument.activeElement );
	}, [ calendarRef ] );

	useEffect( () => {
		if ( ! hadGridFocusRef.current ) {
			return;
		}
		hadGridFocusRef.current = false;
		const calendar = calendarRef.current;
		if ( ! calendar ) {
			return;
		}
		const { activeElement, body } = calendar.ownerDocument;
		if ( activeElement && activeElement !== body ) {
			return;
		}
		calendar
			.querySelector< HTMLButtonElement >(
				'[role="gridcell"][aria-selected="true"]:not([data-outside]) button'
			)
			?.focus();
	}, [ calendarMonth, calendarRef ] );

	return markFocusForRestore;
}
