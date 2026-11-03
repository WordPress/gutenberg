import { useState } from '@wordpress/element';
import fastDeepEqual from 'fast-deep-equal';
import type { LinkControlSuggestion, LinkControlValue } from './types';

const ENTITY_KEYS = [ 'id', 'kind', 'type' ] as const;

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

	const setInternalURLInputValue = (
		nextValue: string | undefined,
		suggestion?: LinkControlSuggestion
	) => {
		// The entity fields describe the URL in the input. A suggestion chosen
		// with the Tab key brings its own, typing back the original URL restores
		// the original's, and any other typed URL has none.
		const source =
			suggestion ?? ( nextValue === value?.url ? value : undefined );
		const nextInternalValue: LinkControlValue = {
			...internalValue,
			url: nextValue,
		};
		for ( const key of ENTITY_KEYS ) {
			if ( source?.[ key ] !== undefined ) {
				nextInternalValue[ key ] = source[ key ];
			} else if ( value && key in value ) {
				// Explicitly `undefined`, so that it replaces the original's
				// field when the two are merged on submit.
				nextInternalValue[ key ] = undefined;
			} else {
				// Leave out a field the original never had, so that the
				// value is unchanged when the original URL is typed back.
				delete nextInternalValue[ key ];
			}
		}
		setInternalValue( nextInternalValue );
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
