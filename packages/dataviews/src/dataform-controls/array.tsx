/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';

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

	// Ensure value is an array
	const arrayValue = useMemo(
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
			// Convert TokenItem objects to strings
			const stringTokens = tokens.map( ( token ) => {
				if ( typeof token !== 'string' ) {
					return token.value;
				}

				const tokenByLabel = findElementByLabel( token );

				return tokenByLabel?.value || token;
			} );

			onChange( {
				[ id ]: stringTokens,
			} );
		},
		[ id, onChange, findElementByLabel ]
	);

	return (
		<FormTokenField
			label={ hideLabelFromVision ? undefined : label }
			value={ arrayValue }
			onChange={ onChangeControl }
			placeholder={ placeholder }
			suggestions={
				elements?.map( ( suggestion ) => suggestion.label ) ?? []
			}
			__experimentalExpandOnFocus={ elements && elements.length > 0 }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}
