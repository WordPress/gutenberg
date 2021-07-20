/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { WheelEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

export interface UseScrollHandlersProps {
	decrement?: () => void;
	increment?: () => void;
	isFocused?: boolean;
	isTypeNumeric?: boolean;
}

const noop = () => {};

export const useScrollHandlers = ( {
	decrement = noop,
	increment = noop,
	isFocused,
	isTypeNumeric,
}: UseScrollHandlersProps ) => {
	const handleOnWheel = useCallback(
		( event: WheelEvent< HTMLElement > ) => {
			if ( ! isTypeNumeric ) return;
			if ( ! isFocused ) return;
			if ( event?.deltaY === 0 ) return;

			const isScrollUp = event?.deltaY < 0;

			if ( isScrollUp ) {
				increment();
			} else {
				decrement();
			}

			return false;
		},
		[ decrement, increment, isFocused, isTypeNumeric ]
	);

	return {
		onWheel: handleOnWheel,
	};
};
