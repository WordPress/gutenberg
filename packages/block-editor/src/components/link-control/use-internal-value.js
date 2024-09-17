/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal';

export default function useInternalValue( value ) {
	const [ internalValue, setInternalValue ] = useState( value || {} );
	const [ previousValue, setPreviousValue ] = useState( value );

	// If the value prop changes, update the internal state.
	// See:
	// - https://github.com/WordPress/gutenberg/pull/51387#issuecomment-1722927384.
	// - https://react.dev/reference/react/useState#storing-information-from-previous-renders.
	if ( ! fastDeepEqual( value, previousValue ) ) {
		setPreviousValue( value );
		setInternalValue( value );
	}

	const setInternalURLInputValue = ( nextValue ) => {
		setInternalValue( {
			...internalValue,
			url: nextValue,
		} );
	};

	const setInternalTextInputValue = ( nextValue ) => {
		setInternalValue( {
			...internalValue,
			title: nextValue,
		} );
	};

	const createSetInternalSettingValueHandler =
		( settingsKeys ) => ( nextValue ) => {
			// Only apply settings values which are defined in the settings prop.
			const settingsUpdates = Object.keys( nextValue ).reduce(
				( acc, key ) => {
					if ( settingsKeys.includes( key ) ) {
						acc[ key ] = nextValue[ key ];
					}
					return acc;
				},
				{}
			);

			setInternalValue( {
				...internalValue,
				...settingsUpdates,
			} );
		};

	return [
		internalValue,
		setInternalValue,
		setInternalURLInputValue,
		setInternalTextInputValue,
		createSetInternalSettingValueHandler,
	];
}
