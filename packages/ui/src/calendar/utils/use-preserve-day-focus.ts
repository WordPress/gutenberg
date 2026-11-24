import { useMergeRefs } from '@wordpress/compose';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import type { DayPickerProps } from '@daypicker/react';
import type { Ref } from 'react';

type DayFocusHandler = NonNullable< DayPickerProps[ 'onDayFocus' ] >;

/**
 * Falls back to a navigation button when a controlled month change removes
 * the focused day and the new month has no enabled day. DayPicker preserves
 * focus itself when an enabled day is available.
 *
 * TODO: Remove this hook after adopting the upstream disabled-calendar focus fix.
 * @see https://github.com/gpbl/react-day-picker/pull/3036
 *
 * @param forwardedRef Ref forwarded to the calendar root.
 * @param month        The controlled first displayed month.
 *
 * @see https://github.com/gpbl/react-day-picker/pull/3010
 */
export function usePreserveDayFocus(
	forwardedRef: Ref< HTMLDivElement >,
	month: Date | undefined
) {
	const rootRef = useRef< HTMLDivElement >( null );
	const hadDayFocusRef = useRef( false );
	const mergedRef = useMergeRefs( [ rootRef, forwardedRef ] );
	const monthIndex = month
		? month.getFullYear() * 12 + month.getMonth()
		: undefined;

	const onDayFocus: DayFocusHandler = useCallback( () => {
		hadDayFocusRef.current = true;
	}, [] );
	const onDayBlur: DayFocusHandler = useCallback( () => {
		hadDayFocusRef.current = false;
	}, [] );

	useEffect( () => {
		if ( ! hadDayFocusRef.current ) {
			return;
		}

		const root = rootRef.current;
		if ( ! root ) {
			return;
		}
		const { activeElement, body } = root.ownerDocument;
		if ( activeElement !== body ) {
			const grid = activeElement?.closest( '[role="grid"]' );
			hadDayFocusRef.current = !! grid && root.contains( grid );
			return;
		}
		hadDayFocusRef.current = false;

		if ( root.querySelector( '[role="grid"] button:not(:disabled)' ) ) {
			return;
		}
		const enabledControl = root.querySelector< HTMLButtonElement >(
			'button:not(:disabled):not([aria-disabled="true"])'
		);
		const focusableControl = root.querySelector< HTMLButtonElement >(
			'button:not(:disabled)'
		);

		( enabledControl ?? focusableControl )?.focus();
	}, [ monthIndex ] );

	return { ref: mergedRef, onDayFocus, onDayBlur };
}
