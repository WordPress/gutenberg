/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';
import useElements from '../hooks/use-elements';

const { ValidatedFormTokenField } = unlock( privateApis );

export default function ArrayControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, getValue, setValue, isValid } = field;
	const value = getValue( { item: data } );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

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
		( tokens: ( string | { value: string; label?: string } )[] ) => {
			const valueTokens = tokens.map( ( token ) => {
				if ( typeof token === 'object' && 'value' in token ) {
					return token.value;
				}
				// If it's a string, it's either a new suggestion value or user input
				return token;
			} );

			onChange( setValue( { item: data, value: valueTokens } ) );
		},
		[ onChange, setValue, data ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<ValidatedFormTokenField
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ hideLabelFromVision ? undefined : label }
			value={ arrayValueAsElements }
			onChange={ onChangeControl }
			placeholder={ placeholder }
			suggestions={ elements?.map( ( element ) => element.value ) }
			__experimentalValidateInput={ ( token: string ) => {
				// If elements validation is required, check if token is valid
				if ( field.isValid?.elements && elements ) {
					return elements.some(
						( element ) =>
							element.value === token || element.label === token
					);
				}

				// For non-elements validation, allow all tokens
				return true;
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
