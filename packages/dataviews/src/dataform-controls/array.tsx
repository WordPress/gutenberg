/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

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

	const findElementByValue = useCallback(
		( suggestionValue: string ) => {
			return elements?.find(
				( suggestion ) => suggestion.value === suggestionValue
			);
		},
		[ elements ]
	);

	const findElementByLabel = useCallback(
		( suggestionLabel: string ) => {
			return elements?.find(
				( suggestion ) => suggestion.label === suggestionLabel
			);
		},
		[ elements ]
	);

	// Convert values to labels for display purposes only
	const arrayValueForDisplay = useMemo(
		() =>
			Array.isArray( value )
				? value.map( ( token ) => {
						const tokenLabel = findElementByValue( token )?.label;
						return tokenLabel || token;
				  } )
				: [],
		[ value, findElementByValue ]
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
			label={ hideLabelFromVision ? undefined : label }
			value={ arrayValueForDisplay }
			onChange={ onChangeControl }
			placeholder={ placeholder }
			suggestions={
				elements?.map( ( suggestion ) => suggestion.label ) ?? []
			}
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
		/>
	);
}
