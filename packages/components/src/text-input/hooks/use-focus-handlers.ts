/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { FocusEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

const noop = () => {};

export interface UseFocusHandlersProps {
	onChange?: ( value: string ) => void;
	setFocused?: ( focused: boolean ) => void;
}

export function useFocusHandlers( {
	onChange = noop,
	setFocused = noop,
}: UseFocusHandlersProps ) {
	const handleOnBlur = useCallback(
		( event: FocusEvent< HTMLInputElement > ) => {
			onChange( event.target.value );
			setFocused( false );
		},
		[ onChange, setFocused ]
	);

	const handleOnFocus = useCallback( () => {
		setFocused( true );
	}, [ setFocused ] );

	return {
		onBlur: handleOnBlur,
		onFocus: handleOnFocus,
	};
}
