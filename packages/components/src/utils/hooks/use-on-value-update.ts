/* eslint-disable jsdoc/require-param */
/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useEvent } from './use-event';

/**
 * Context object for the `onUpdate` callback of `useOnValueUpdate`.
 */
export type ValueUpdateContext< T > = {
	previousValue: T;
};

/**
 * Calls the `onUpdate` callback when the `value` changes.
 */
export function useOnValueUpdate< T >(
	/**
	 * The value to watch for changes.
	 */
	value: T,
	/**
	 * Callback to fire when the value changes.
	 */
	onUpdate: ( context: ValueUpdateContext< T > ) => void
) {
	const previousValueRef = useRef( value );
	const updateCallbackEvent = useEvent( onUpdate );
	useEffect( () => {
		if ( previousValueRef.current !== value ) {
			updateCallbackEvent( {
				previousValue: previousValueRef.current,
			} );
			previousValueRef.current = value;
		}
	}, [ updateCallbackEvent, value ] );
}
/* eslint-enable jsdoc/require-param */
