/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import normalizeFields from '../utils/normalize-fields';
import type { Field, Form, FormValidity } from '../types';

const isEmptyNullOrUndefined = ( value: any ) =>
	[ undefined, '', null ].includes( value );

const isArrayOrElementsEmptyNullOrUndefined = ( value: any ) => {
	return (
		! Array.isArray( value ) ||
		value.length === 0 ||
		value.every( ( element: any ) => isEmptyNullOrUndefined( element ) )
	);
};

function isInvalidForRequired( fieldType: string | undefined, value: any ) {
	if (
		( fieldType === undefined && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'text' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'email' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'url' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'telephone' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'password' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'integer' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'number' && isEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'array' &&
			isArrayOrElementsEmptyNullOrUndefined( value ) ) ||
		( fieldType === 'boolean' && value !== true )
	) {
		return true;
	}

	return false;
}

/**
 * Hook that validates a form item and returns an object with error messages for each field.
 *
 * @param item   The item to validate.
 * @param fields Fields config.
 * @param form   Form config.
 *
 * @return Record of field IDs to error messages (undefined means no error).
 */
export function useFormValidity< Item >(
	item: Item,
	fields: Field< Item >[],
	form: Form
): FormValidity {
	const [ formValidity, setFormValidity ] = useState< FormValidity >();

	const previousValidatedValuesRef = useRef< Record< string, any > >( {} );

	const validate = useCallback( () => {
		if ( typeof form.fields === 'undefined' ) {
			setFormValidity( undefined );
			return;
		}

		const normalizedFields = normalizeFields(
			fields.filter( ( field ) => {
				return form?.fields?.some( ( formField ) => {
					if ( typeof formField === 'string' ) {
						return formField === field.id;
					}

					return formField.id === field.id;
				} );
			} )
		);

		normalizedFields.forEach( ( field ) => {
			const value = field.getValue( { item } );
			if (
				previousValidatedValuesRef.current.hasOwnProperty( field.id ) &&
				value === previousValidatedValuesRef.current[ field.id ]
			) {
				return;
			}
			previousValidatedValuesRef.current[ field.id ] = value;

			// Check isValid.required
			if (
				field.isValid.required &&
				isInvalidForRequired( field.type, value )
			) {
				setFormValidity( ( prev ) => ( {
					...prev,
					[ field.id ]: {
						...prev?.[ field.id ],
						required: {
							type: 'invalid',
						},
					},
				} ) );
				return;
			}

			// Check isValid.elements
			if ( field.isValid.elements && field.elements ) {
				const validValues = field.elements.map(
					( element ) => element.value
				);

				if ( field.type === 'array' ) {
					// Arrays (all values must be valid):
					if ( Array.isArray( value ) ) {
						const allAreValid = value.every( ( arrayItem ) =>
							validValues.includes( arrayItem )
						);
						if ( allAreValid ) {
							return;
						}
						setFormValidity( ( prev ) => ( {
							...prev,
							[ field.id ]: {
								...prev?.[ field.id ],
								elements: {
									type: 'invalid',
									message:
										'Value must be one of the elements.',
								},
							},
						} ) );
						return;
					}

					setFormValidity( ( prev ) => ( {
						...prev,
						[ field.id ]: {
							...prev?.[ field.id ],
							elements: {
								type: 'invalid',
								message: 'Value must be one of the elements.',
							},
						},
					} ) );
					return;
				}

				// Single-value fields:
				const isValid = validValues.includes( value );
				if ( isValid ) {
					return;
				}

				setFormValidity( ( prev ) => ( {
					...prev,
					[ field.id ]: {
						...prev?.[ field.id ],
						elements: {
							type: 'invalid',
							message: 'Value must be one of the elements.',
						},
					},
				} ) );
				return;
			}

			// Check isValid.custom (async)
			if (
				typeof field.isValid.custom === 'function' &&
				field.isValid.custom.constructor.name === 'AsyncFunction'
			) {
				const customAsyncError = field.isValid.custom(
					deepMerge(
						item,
						field.setValue( {
							item,
							value,
						} ) as Partial< Item >
					),
					field
				);
				if ( customAsyncError === null ) {
					return;
				}

				setFormValidity( ( prev ) => ( {
					...prev,
					[ field.id ]: {
						...prev?.[ field.id ],
						custom: {
							type: 'validating',
							message: 'Validating...',
						},
					},
				} ) );

				if ( customAsyncError instanceof Promise ) {
					customAsyncError
						.then( ( result ) => {
							if ( result === null ) {
								setFormValidity( ( prev ) => ( {
									...prev,
									[ field.id ]: {
										...prev?.[ field.id ],
										custom: {
											type: 'valid',
											message: 'Valid',
										},
									},
								} ) );
							}

							if ( typeof result === 'string' ) {
								setFormValidity( ( prev ) => ( {
									...prev,
									[ field.id ]: {
										...prev?.[ field.id ],
										custom: {
											type: 'invalid',
											message: result,
										},
									},
								} ) );
							}
						} )
						.catch( ( error ) => {
							setFormValidity( ( prev ) => ( {
								...prev,
								[ field.id ]: {
									...prev?.[ field.id ],
									custom: {
										type: 'invalid',
										message: error.message,
									},
								},
							} ) );
						} );
				}

				return;
			}

			// Check isValid.custom (sync)
			if (
				typeof field.isValid.custom === 'function' &&
				! ( field.isValid.custom.constructor.name === 'AsyncFunction' )
			) {
				const customError = field.isValid.custom( item, field );
				if ( typeof customError === 'string' ) {
					setFormValidity( ( prev ) => ( {
						...prev,
						[ field.id ]: {
							...prev?.[ field.id ],
							custom: {
								type: 'invalid',
								message: customError,
							},
						},
					} ) );
					return;
				}
			}

			// No errors for this field, remove from errors object
			setFormValidity( ( prev ) => {
				if ( ! prev || ! prev[ field.id ] ) {
					return prev;
				}

				const { [ field.id ]: removed, ...rest } = prev;

				if ( Object.keys( rest ).length === 0 ) {
					return undefined;
				}

				return rest;
			} );
		} );
	}, [ item, fields, form ] );

	useEffect( () => {
		validate();
	}, [ validate ] );

	return formValidity;
}

export default useFormValidity;
