/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedFormTokenField } = unlock( privateApis );

export default function ArrayControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, placeholder, elements } = field;
	const value = field.getValue( { item: data } );

	const findElementByLabel = useCallback(
		( suggestionLabel: string ) => {
			return elements?.find(
				( suggestion ) => suggestion.label === suggestionLabel
			);
		},
		[ elements ]
	);
	const [ customValidity, setCustomValidity ] = useState<
		| {
				type: 'validating' | 'valid' | 'invalid';
				message: string;
		  }
		| undefined
	>( undefined );

	// Convert stored values to element objects for the token field
	const arrayValueAsElements = useMemo(
		() =>
			Array.isArray( value )
				? value.map( ( token ) => {
						const element = elements?.find(
							( suggestion ) => suggestion.value === token
						);
						return element || { value: token, label: token };
				  } )
				: [],
		[ value, elements ]
	);

	const onChangeControl = useCallback(
		( tokens: ( string | { value: string } )[] ) => {
			// Convert display labels back to values for storage
			const valueTokens = tokens.map( ( token ) => {
				if ( typeof token !== 'string' ) {
					return token.value;
				}

				// If user entered a label, convert it to its corresponding value
				const elementByLabel = findElementByLabel( token );
				if ( elementByLabel ) {
					return elementByLabel.value;
				}

				// If no matching element found, treat it as a direct value
				// This handles cases where user types values directly or when elements aren't defined
				return token;
			} );

			onChange( {
				[ id ]: valueTokens,
			} );
		},
		[ id, onChange, findElementByLabel ]
	);

	const onFocus = useCallback( () => {
		setCustomValidity( undefined );
	}, [] );

	return (
		<ValidatedFormTokenField
			required={ !! field.isValid?.required }
			customValidator={ ( displayLabels: any ) => {
				if ( field.isValid?.custom ) {
					// Convert display labels back to values for validation
					const actualValues = Array.isArray( displayLabels )
						? displayLabels.map( ( displayLabel ) => {
								const elementByLabel =
									findElementByLabel( displayLabel );
								return elementByLabel?.value || displayLabel;
						  } )
						: displayLabels;

					const result = field.isValid.custom(
						{
							...data,
							[ id ]: actualValues,
						},
						field
					);
					return result || undefined;
				}

				return undefined;
			} }
			customValidity={ customValidity }
			label={ hideLabelFromVision ? undefined : label }
			value={ arrayValueAsElements }
			onChange={ onChangeControl }
			onFocus={ onFocus }
			placeholder={ placeholder }
			suggestions={ elements?.map( ( element ) => element.value ) }
			__experimentalValidateInput={ ( token: string ) => {
				if ( ! field.isValid?.elements ) {
					return true;
				}

				// Check if the token matches any of the available elements
				const tokenByLabel = findElementByLabel( token );
				return !! tokenByLabel;
			} }
			__experimentalExpandOnFocus={ elements && elements.length > 0 }
			__experimentalShowHowTo={ ! field.isValid?.elements }
			displayTransform={ ( token: any ) => {
				// For existing tokens (element objects), display their label
				if ( typeof token === 'object' && 'label' in token ) {
					return token.label;
				}
				// For suggestions (value strings), find the corresponding element and show its label
				if ( typeof token === 'string' && elements ) {
					const element = elements.find(
						( el ) => el.value === token
					);
					return element?.label || token;
				}
				return token;
			} }
			__experimentalRenderItem={ ( { item }: { item: any } ) => {
				// Custom rendering for suggestion items (item is a value string)
				if ( typeof item === 'string' && elements ) {
					const element = elements.find(
						( el ) => el.value === item
					);
					return <span>{ element?.label || item }</span>;
				}
				return <span>{ item }</span>;
			} }
		/>
	);
}
