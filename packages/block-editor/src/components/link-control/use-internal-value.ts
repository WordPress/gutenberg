import { useState } from '@wordpress/element';
import fastDeepEqual from 'fast-deep-equal';
import type { LinkControlValue } from './types';

export default function useInternalValue(
	value: LinkControlValue | undefined
) {
	const [ internalValue, setInternalValue ] = useState<
		LinkControlValue | undefined
	>( value || {} );
	const [ previousValue, setPreviousValue ] = useState( value );

	// If the value prop changes, update the internal state.
	// See:
	// - https://github.com/WordPress/gutenberg/pull/51387#issuecomment-1722927384.
	// - https://react.dev/reference/react/useState#storing-information-from-previous-renders.
	if ( ! fastDeepEqual( value, previousValue ) ) {
		setPreviousValue( value );
		setInternalValue( value );
	}

	const setInternalURLInputValue = ( nextValue: string | undefined ) => {
		setInternalValue( {
			...internalValue,
			url: nextValue,
		} );
	};

	const setInternalTextInputValue = ( nextValue: string ) => {
		setInternalValue( {
			...internalValue,
			title: nextValue,
		} );
	};

	const createSetInternalSettingValueHandler =
		( settingsKeys: string[] ) => ( nextValue: LinkControlValue ) => {
			// Only apply settings values which are defined in the settings prop.
			const settingsUpdates = Object.keys( nextValue ).reduce(
				( acc, key ) => {
					if ( settingsKeys.includes( key ) ) {
						acc[ key ] = nextValue[ key ];
					}
					return acc;
				},
				{} as LinkControlValue
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
	] as const;
}
