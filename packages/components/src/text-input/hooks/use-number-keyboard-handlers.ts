/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { normalizeArrowKey } from '../../utils/keyboard';

export interface UseNumberKeyboardHandlersProps {
	isTypeNumeric?: boolean;
	increment?: () => void;
	decrement?: () => void;
	stopIfEventDefaultPrevented?: boolean;
}

const noop = () => {};

export function useNumberKeyboardHandlers( {
	decrement = noop,
	increment = noop,
	isTypeNumeric,
	stopIfEventDefaultPrevented = true,
}: UseNumberKeyboardHandlersProps ) {
	/** @type {Record<string, (event: import('react').KeyboardEvent<HTMLInputElement>) => void>} */
	const keyboardHandlers = useMemo(
		() =>
			( {
				ArrowUp( event: KeyboardEvent< HTMLInputElement > ) {
					if ( ! isTypeNumeric ) return;

					if (
						stopIfEventDefaultPrevented &&
						event.isDefaultPrevented()
					)
						return;

					event.preventDefault();

					increment();
				},
				ArrowDown( event: KeyboardEvent< HTMLInputElement > ) {
					if ( ! isTypeNumeric ) return;

					if (
						stopIfEventDefaultPrevented &&
						event.isDefaultPrevented()
					)
						return;

					event.preventDefault();

					decrement();
				},
			} as const ),
		[ decrement, increment, isTypeNumeric, stopIfEventDefaultPrevented ]
	);

	const handleOnKeyDown = useCallback(
		( event: KeyboardEvent< HTMLInputElement > ) => {
			const key = normalizeArrowKey( event );
			if ( key in keyboardHandlers ) {
				keyboardHandlers[ key as keyof typeof keyboardHandlers ](
					event
				);
			}
		},
		[ keyboardHandlers ]
	);

	return {
		onKeyDown: handleOnKeyDown,
	};
}
