/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import normalizeFields from '../utils/normalize-fields';
import normalizeFormFields from '../dataform-layouts/normalize-form-fields';
import type {
	CombinedFormField,
	Field,
	FieldValidity,
	Form,
	FormValidity,
	NormalizedField,
} from '../types';
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
		return Object.entries( fieldValidation ).every(
			( [ key, validation ] ) => {
				if (
					key === 'children' &&
					validation &&
					typeof validation === 'object'
				) {
					// Recursively check children validations
					return isFormValid( validation as FormValidity );
				}
				return validation.type === 'valid';
			}
		);
	} );
}

function updateFieldValidity(
	setFormValidity: React.Dispatch< React.SetStateAction< FormValidity > >,
	parentFieldId: string | undefined,
	fieldId: string,
	newValidity: FieldValidity
) {
	if ( parentFieldId ) {
		setFormValidity( ( prev ) => ( {
			...prev,
			[ parentFieldId ]: {
				...prev?.[ parentFieldId ],
				children: {
					...prev?.[ parentFieldId ]?.children,
					[ fieldId ]: {
						...newValidity,
					},
				},
			},
		} ) );
	} else {
		setFormValidity( ( prev ) => ( {
			...prev,
			[ fieldId ]: {
				...newValidity,
			},
		} ) );
	}
}

function getFieldsToValidate< Item >(
	fields: Field< Item >[],
	form: Form
): {
	fields: NormalizedField< Item >[];
	fieldToParent: Map< string, string >;
} {
	const formFields = normalizeFormFields( form );
	if ( formFields.length === 0 ) {
		return { fields: [], fieldToParent: new Map() };
	}

	const fieldToParent = new Map< string, string >();
	const fieldIdsToValidate: string[] = [];
	formFields.forEach( ( formField ) => {
		if ( !! ( formField as CombinedFormField ).children ) {
			( formField as CombinedFormField ).children.forEach( ( child ) => {
				const childId = typeof child === 'string' ? child : child.id;
				fieldIdsToValidate.push( childId );
				fieldToParent.set( childId, formField.id );
			} );
		} else {
			fieldIdsToValidate.push( formField.id );
		}
	} );

	return {
		fields: normalizeFields(
			fields.filter( ( field ) =>
				fieldIdsToValidate.includes( field.id )
			)
		),
		fieldToParent,
	};
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

	// The following counters are used to track the validation promises triggered
	// by executing isValid.custom and the elements validation. When the promise resolves,
	// it will update the form validity state ONLY if its counter matches the current one.
	const customValidationCounterRef = useRef< Record< string, number > >( {} );
	const elementsValidationCounterRef = useRef< Record< string, number > >(
		{}
	);

	const validate = useCallback( () => {
		const { fields: fieldsToValidate, fieldToParent } = getFieldsToValidate(
			fields,
			form
		);
		if ( fieldsToValidate.length === 0 ) {
			setFormValidity( undefined );
			return;
		}

		fieldsToValidate.forEach( ( field ) => {
			const value = field.getValue( { item } );
			if (
				previousValidatedValuesRef.current.hasOwnProperty( field.id ) &&
				value === previousValidatedValuesRef.current[ field.id ]
			) {
				return;
			}
			previousValidatedValuesRef.current[ field.id ] = value;

			const parentFieldId = fieldToParent.get( field.id );

			// isValid.required
			if (
				field.isValid.required &&
				isInvalidForRequired( field.type, value )
			) {
				updateFieldValidity( setFormValidity, parentFieldId, field.id, {
					required: { type: 'invalid' },
				} );
				return;
			}

			// isValid.elements (static elements)
			if (
				field.isValid.elements &&
				field.hasElements &&
				! field.getElements &&
				Array.isArray( field.elements )
			) {
				const validValues = field.elements.map( ( el ) => el.value );

				if (
					field.type !== 'array' &&
					! validValues.includes( value )
				) {
					updateFieldValidity(
						setFormValidity,
						parentFieldId,
						field.id,
						{
							elements: {
								type: 'invalid',
								message: 'Value must be one of the elements.',
							},
						}
					);
					return;
				}

				if ( field.type === 'array' && ! Array.isArray( value ) ) {
					updateFieldValidity(
						setFormValidity,
						parentFieldId,
						field.id,
						{
							elements: {
								type: 'invalid',
								message: 'Value must be an array.',
							},
						}
					);
					return;
				}
				if (
					field.type === 'array' &&
					value.some( ( v: any ) => ! validValues.includes( v ) )
				) {
					updateFieldValidity(
						setFormValidity,
						parentFieldId,
						field.id,
						{
							elements: {
								type: 'invalid',
								message: 'Value must be one of the elements.',
							},
						}
					);
					return;
				}
			}

			// isValid.elements (get them via getElements first)
			if (
				field.isValid.elements &&
				field.hasElements &&
				typeof field.getElements === 'function'
			) {
				const currentToken =
					( elementsValidationCounterRef.current[ field.id ] || 0 ) +
					1;
				elementsValidationCounterRef.current[ field.id ] = currentToken;
				updateFieldValidity( setFormValidity, parentFieldId, field.id, {
					elements: {
						type: 'validating',
						message: 'Validating...',
					},
				} );

				field
					.getElements()
					.then( ( result ) => {
						if (
							elementsValidationCounterRef.current[ field.id ] !==
							currentToken
						) {
							return;
						}

						if ( ! Array.isArray( result ) ) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									elements: {
										type: 'invalid',
										message: 'Could not validate elements.',
									},
								}
							);
							return;
						}

						const validValues = result.map( ( el ) => el.value );
						if (
							field.type !== 'array' &&
							! validValues.includes( value )
						) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									elements: {
										type: 'invalid',
										message:
											'Value must be one of the elements.',
									},
								}
							);
							return;
						}

						if (
							field.type === 'array' &&
							! Array.isArray( value )
						) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									elements: {
										type: 'invalid',
										message: 'Value must be an array.',
									},
								}
							);
							return;
						}

						if (
							field.type === 'array' &&
							value.some(
								( v: any ) => ! validValues.includes( v )
							)
						) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									elements: {
										type: 'invalid',
										message:
											'Value must be one of the elements.',
									},
								}
							);
						}
					} )
					.catch( ( error ) => {
						if (
							elementsValidationCounterRef.current[ field.id ] !==
							currentToken
						) {
							return;
						}

						updateFieldValidity(
							setFormValidity,
							parentFieldId,
							field.id,
							{
								elements: {
									type: 'invalid',
									message: error.message,
								},
							}
						);
					} );
			}

			// Check isValid.custom
			let customError;
			try {
				customError = field.isValid?.custom?.(
					deepMerge(
						item,
						field.setValue( {
							item,
							value,
						} ) as Partial< Item >
					),
					field
				);
			} catch ( error: any ) {
				let errorMessage;
				if ( error instanceof Error ) {
					errorMessage = error.message;
				} else {
					errorMessage =
						String( error ) ||
						__( 'Unknown error when running custom validation.' );
				}

				updateFieldValidity( setFormValidity, parentFieldId, field.id, {
					custom: {
						type: 'invalid',
						message: errorMessage,
					},
				} );
			}

			// — isValid.custom (sync version)
			if ( typeof customError === 'string' ) {
				updateFieldValidity( setFormValidity, parentFieldId, field.id, {
					custom: {
						type: 'invalid',
						message: customError,
					},
				} );
				return;
			}

			// — isValid.custom (async version)
			if ( customError instanceof Promise ) {
				// Increment token for this field to track the latest validation
				const currentToken =
					( customValidationCounterRef.current[ field.id ] || 0 ) + 1;
				customValidationCounterRef.current[ field.id ] = currentToken;

				updateFieldValidity( setFormValidity, parentFieldId, field.id, {
					custom: {
						type: 'validating',
						message: 'Validating...',
					},
				} );

				customError
					.then( ( result ) => {
						if (
							customValidationCounterRef.current[ field.id ] !==
							currentToken
						) {
							return;
						}

						if ( result === null ) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									custom: {
										type: 'valid',
										message: 'Valid',
									},
								}
							);
							return;
						}

						if ( typeof result === 'string' ) {
							updateFieldValidity(
								setFormValidity,
								parentFieldId,
								field.id,
								{
									custom: {
										type: 'invalid',
										message: result,
									},
								}
							);
						}
					} )
					.catch( ( error ) => {
						if (
							customValidationCounterRef.current[ field.id ] !==
							currentToken
						) {
							return;
						}

						updateFieldValidity(
							setFormValidity,
							parentFieldId,
							field.id,
							{
								custom: {
									type: 'invalid',
									message: error.message,
								},
							}
						);
					} );

				return;
			}

			// No errors for this field, remove from errors object
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

					const { [ field.id ]: removed, ...restChildren } =
						parentField.children as any;

					// If no more children, remove the children property
					if ( Object.keys( restChildren ).length === 0 ) {
						const { children, ...restParent } = parentField;
						if ( Object.keys( restParent ).length === 0 ) {
							// Remove parent field entirely if no other validations
							const {
								[ parentFieldId ]: removedParent,
								...restFields
							} = prev;
							return Object.keys( restFields ).length === 0
								? undefined
								: restFields;
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
