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
import type { Field, Form, FormValidity, CombinedFormField } from '../types';

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

function isFormValid( formValidity: FormValidity | undefined ): boolean {
	if ( ! formValidity ) {
		return true;
	}

	return Object.values( formValidity ).every( ( fieldValidation ) => {
		return Object.entries( fieldValidation ).every( ( [ key, validation ] ) => {
			if ( key === 'children' && validation && typeof validation === 'object' ) {
				// Recursively check children validations
				return isFormValid( validation as FormValidity );
			}
			return validation.type === 'valid';
		} );
	} );
}

type ValidationUpdate = {
	required?: { type: 'valid' | 'invalid' | 'validating'; message?: string };
	elements?: { type: 'valid' | 'invalid' | 'validating'; message: string };
	custom?: { type: 'valid' | 'invalid' | 'validating'; message: string };
};

function updateFieldValidity(
	setFormValidity: React.Dispatch< React.SetStateAction< FormValidity > >,
	fieldId: string,
	validationUpdate: ValidationUpdate,
	parentFieldId?: string
) {
	if ( parentFieldId ) {
		// This field is a child of a combined field
		setFormValidity( ( prev ) => ( {
			...prev,
			[ parentFieldId ]: {
				...prev?.[ parentFieldId ],
				children: {
					...prev?.[ parentFieldId ]?.children,
					[ fieldId ]: {
						...( prev?.[ parentFieldId ]?.children as any )?.[ fieldId ],
						...validationUpdate,
					},
				},
			},
		} ) );
	} else {
		setFormValidity( ( prev ) => ( {
			...prev,
			[ fieldId ]: {
				...prev?.[ fieldId ],
				...validationUpdate,
			},
		} ) );
	}
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
): { validity: FormValidity; isValid: boolean } {
	const [ formValidity, setFormValidity ] = useState< FormValidity >();
	const previousValidatedValuesRef = useRef< Record< string, any > >( {} );

	const validate = useCallback( () => {
		if ( typeof form.fields === 'undefined' ) {
			setFormValidity( undefined );
			return;
		}

		// Build a map of field ID -> parent field ID for combined fields with children
		const fieldParentMap = new Map< string, string >();

		// Collect all field IDs that should be validated (including children)
		const fieldIdsToValidate = new Set< string >();

		form.fields.forEach( ( formField ) => {
			if ( typeof formField === 'string' ) {
				fieldIdsToValidate.add( formField );
			} else {
				// Check if this is a CombinedFormField with children
				const combinedField = formField as CombinedFormField;
				if ( combinedField.children ) {
					combinedField.children.forEach( ( child ) => {
						const childId = typeof child === 'string' ? child : child.id;
						fieldIdsToValidate.add( childId );
						fieldParentMap.set( childId, combinedField.id );
					} );
				} else {
					fieldIdsToValidate.add( formField.id );
				}
			}
		} );

		const normalizedFields = normalizeFields(
			fields.filter( ( field ) => fieldIdsToValidate.has( field.id ) )
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
				const parentFieldId = fieldParentMap.get( field.id );
				updateFieldValidity(
					setFormValidity,
					field.id,
					{ required: { type: 'invalid' } },
					parentFieldId
				);
				return;
			}

			// Check isValid.elements
			if ( field.isValid.elements && field.elements ) {
				const validValues = field.elements.map(
					( element ) => element.value
				);
				const parentFieldId = fieldParentMap.get( field.id );

				if ( field.type === 'array' ) {
					// Arrays (all values must be valid):
					if ( Array.isArray( value ) ) {
						const allAreValid = value.every( ( arrayItem ) =>
							validValues.includes( arrayItem )
						);
						if ( allAreValid ) {
							return;
						}
						updateFieldValidity(
							setFormValidity,
							field.id,
							{
								elements: {
									type: 'invalid',
									message: 'Value must be one of the elements.',
								},
							},
							parentFieldId
						);
						return;
					}

					updateFieldValidity(
						setFormValidity,
						field.id,
						{
							elements: {
								type: 'invalid',
								message: 'Value must be one of the elements.',
							},
						},
						parentFieldId
					);
					return;
				}

				// Single-value fields:
				const isValid = validValues.includes( value );
				if ( isValid ) {
					return;
				}

				updateFieldValidity(
					setFormValidity,
					field.id,
					{
						elements: {
							type: 'invalid',
							message: 'Value must be one of the elements.',
						},
					},
					parentFieldId
				);
				return;
			}

			// Check isValid.custom (async)
			if (
				typeof field.isValid.custom === 'function' &&
				field.isValid.custom.constructor.name === 'AsyncFunction'
			) {
				const parentFieldId = fieldParentMap.get( field.id );
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

				updateFieldValidity(
					setFormValidity,
					field.id,
					{
						custom: {
							type: 'validating',
							message: 'Validating...',
						},
					},
					parentFieldId
				);

				if ( customAsyncError instanceof Promise ) {
					customAsyncError
						.then( ( result ) => {
							if ( result === null ) {
								updateFieldValidity(
									setFormValidity,
									field.id,
									{
										custom: {
											type: 'valid',
											message: 'Valid',
										},
									},
									parentFieldId
								);
							}

							if ( typeof result === 'string' ) {
								updateFieldValidity(
									setFormValidity,
									field.id,
									{
										custom: {
											type: 'invalid',
											message: result,
										},
									},
									parentFieldId
								);
							}
						} )
						.catch( ( error ) => {
							updateFieldValidity(
								setFormValidity,
								field.id,
								{
									custom: {
										type: 'invalid',
										message: error.message,
									},
								},
								parentFieldId
							);
						} );
				}

				return;
			}

			// Check isValid.custom (sync)
			if (
				typeof field.isValid.custom === 'function' &&
				! ( field.isValid.custom.constructor.name === 'AsyncFunction' )
			) {
				const parentFieldId = fieldParentMap.get( field.id );
				const customError = field.isValid.custom( item, field );
				if ( typeof customError === 'string' ) {
					updateFieldValidity(
						setFormValidity,
						field.id,
						{
							custom: {
								type: 'invalid',
								message: customError,
							},
						},
						parentFieldId
					);
					return;
				}
			}

			// No errors for this field, remove from errors object
			const parentFieldId = fieldParentMap.get( field.id );
			setFormValidity( ( prev ) => {
				if ( ! prev ) {
					return prev;
				}

				if ( parentFieldId ) {
					// This field is a child - remove it from parent's children
					const parentField = prev[ parentFieldId ];
					if ( ! parentField?.children ) {
						return prev;
					}

					const { [ field.id ]: removed, ...restChildren } = parentField.children as any;

					// If no more children, remove the children property
					if ( Object.keys( restChildren ).length === 0 ) {
						const { children, ...restParent } = parentField;
						if ( Object.keys( restParent ).length === 0 ) {
							// Remove parent field entirely if no other validations
							const { [ parentFieldId ]: removedParent, ...restFields } = prev;
							return Object.keys( restFields ).length === 0 ? undefined : restFields;
						}
						return {
							...prev,
							[ parentFieldId ]: restParent,
						};
					}

					return {
						...prev,
						[ parentFieldId ]: {
							...parentField,
							children: restChildren,
						},
					};
				}

				// Regular field - remove from top level
				if ( ! prev[ field.id ] ) {
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

	return {
		validity: formValidity,
		isValid: isFormValid( formValidity ),
	};
}

export default useFormValidity;
