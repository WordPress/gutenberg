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

const noop = () => {};

export interface UseKeyboardHandlersProps {
	onChange?: ( value: string ) => void;
}

export function useKeyboardHandlers( {
	onChange = noop,
}: UseKeyboardHandlersProps ) {
	const keyboardHandlers = useMemo(
		() =>
			( {
				Enter( event: KeyboardEvent< HTMLInputElement > ) {
					if ( event.isDefaultPrevented() ) {
						return;
					}
					onChange( event.currentTarget.value );
				},
			} as const ),
		[ onChange ]
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
	} as const;
}
