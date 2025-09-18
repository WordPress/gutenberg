/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
	const { label, placeholder, elements, getValue, setValue } = field;
	const value = getValue( { item: data } );

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

	const validateTokens = useCallback(
		( tokens: ( string | { value: string; label?: string } )[] ) => {
			// Extract actual values from tokens for validation
			const tokenValues = tokens.map( ( token ) => {
				if ( typeof token === 'object' && 'value' in token ) {
					return token.value;
				}
				return token;
			} );

			// First, check if elements validation is required and any tokens are invalid
			if ( field.isValid?.elements && elements ) {
				const invalidTokens = tokenValues.filter( ( tokenValue ) => {
					return ! elements.some(
						( element ) => element.value === tokenValue
					);
				} );

				if ( invalidTokens.length > 0 ) {
					setCustomValidity( {
						type: 'invalid',
						message: __(
							'Please select from the available options.'
						),
					} );
					return;
				}
			}

			// Then check custom validation if provided.
			if ( field.isValid?.custom ) {
				const result = field.isValid?.custom?.(
					deepMerge(
						data,
						setValue( {
							item: data,
							value: tokenValues,
						} ) as Partial< Item >
					),
					field
				);

				if ( result ) {
					setCustomValidity( {
						type: 'invalid',
						message: result,
					} );
					return;
				}
			}

			// If no validation errors, clear custom validity
			setCustomValidity( undefined );
		},
		[ elements, data, field, setValue ]
	);

	// Generate custom invalid message for elements validation
	const customInvalidMessage = useMemo( () => {
		if ( field.isValid?.elements && elements ) {
			return __( 'Please select from the available options.' );
		}
		return __( 'Invalid item' );
	}, [ field.isValid?.elements, elements ] );

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

			validateTokens( tokens );
		},
		[ onChange, setValue, data, validateTokens ]
	);

	const onInputChange = useCallback( ( input: string ) => {
		if ( input === '' ) {
			// Reset custom validity when input is cleared
			setCustomValidity( undefined );
		}
	}, [] );

	return (
		<ValidatedFormTokenField
			required={ !! field.isValid?.required }
			onValidate={ validateTokens }
			customValidity={ customValidity }
			label={ hideLabelFromVision ? undefined : label }
			value={ arrayValueAsElements }
			onChange={ onChangeControl }
			onInputChange={ onInputChange }
			placeholder={ placeholder }
			suggestions={ elements?.map( ( element ) => element.value ) }
			messages={ {
				added: __( 'Item added.' ),
				removed: __( 'Item removed.' ),
				remove: __( 'Remove item' ),
				__experimentalInvalid: customInvalidMessage,
			} }
			__experimentalValidateInput={ ( token: string ) => {
				// If elements validation is required, check if token is valid
				if ( field.isValid?.elements && elements ) {
					const isValidToken = elements.some(
						( element ) =>
							element.value === token || element.label === token
					);

					// If invalid, trigger error message display using the main validation function
					if ( ! isValidToken ) {
						// Create a temporary token object to trigger validation
						const tempTokens = [
							...arrayValueAsElements,
							{ value: token, label: token },
						];
						validateTokens( tempTokens );
					}

					return isValidToken;
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
