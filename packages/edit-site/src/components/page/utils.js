/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

const createStoredStateProvider = ( store ) => ( key, initialValue ) => {
	const getValue = useCallback( () => {
		// Bail if we're not in a browser context.
		if ( typeof window === 'undefined' ) return initialValue;

		try {
			const value = window[ store ].getItem( key );
			return value ? JSON.parse( value ) : initialValue;
		} catch ( error ) {
			return initialValue;
		}
	}, [ key, initialValue ] );

	const [ storedValue, setStoredValue ] = useState( getValue );

	const setValue = useCallback(
		( value ) => {
			// Bail if we're not in a browser context.
			if ( typeof window === 'undefined' ) return;

			try {
				const newValue =
					value instanceof Function ? value( storedValue ) : value;
				window[ store ].setItem( key, JSON.stringify( newValue ) );
				setStoredValue( newValue );
			} catch ( error ) {}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ key ]
	);
	return [ storedValue, setValue ];
};

export const useStateWithLocalStorage =
	createStoredStateProvider( 'localStorage' );
export const useStateWithSessionStorage =
	createStoredStateProvider( 'sessionStorage' );
