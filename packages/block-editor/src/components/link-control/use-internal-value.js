/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default function useInternalValue( value ) {
	const [ internalValue, setInternalValue ] = useState( value || {} );

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
