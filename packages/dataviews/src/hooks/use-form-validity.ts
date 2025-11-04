/**
 * External dependencies
 */
import deepMerge from 'deepmerge';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import normalizeFields from '../utils/normalize-fields';
import normalizeForm from '../dataform-layouts/normalize-form';
import type {
	Field,
	FieldValidity,
	Form,
	FormValidity,
	NormalizedField,
	NormalizedFormField,
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

type FormFieldToValidate< Item > = {
	id: string;
	children: FormFieldToValidate< Item >[];
	field?: NormalizedField< Item >;
};

function getFormFieldsToValidate< Item >(
	form: Form,
	fields: Field< Item >[]
): FormFieldToValidate< Item >[] {
	const normalizedForm = normalizeForm( form );
	if ( normalizedForm.fields.length === 0 ) {
		return [];
	}

	// Create a map of field IDs to Field definitions for fast lookup
	const fieldsMap = new Map< string, Field< Item > >();
	fields.forEach( ( field ) => {
		fieldsMap.set( field.id, field );
	} );

	// Recursive function to process form fields and their children
	function processFormField(
		formField: NormalizedFormField
	): FormFieldToValidate< Item > | null {
		// Handle combined fields (fields with children)
		if ( 'children' in formField && Array.isArray( formField.children ) ) {
			const processedChildren = formField.children
				.map( processFormField )
				.filter( ( child ) => child !== null );

			if ( processedChildren.length === 0 ) {
				return null;
			}

			const fieldDef = fieldsMap.get( formField.id );
			if ( fieldDef ) {
				const [ normalizedField ] = normalizeFields< Item >( [
					fieldDef,
				] );

				return {
					id: formField.id,
					children: processedChildren,
					field: normalizedField,
				} satisfies FormFieldToValidate< Item >;
			}

			return {
				id: formField.id,
				children: processedChildren,
			} satisfies FormFieldToValidate< Item >;
		}

		// Handle leaf fields (fields without children)
		const fieldDef = fieldsMap.get( formField.id );
		if ( ! fieldDef ) {
			return null;
		}

		const [ normalizedField ] = normalizeFields< Item >( [ fieldDef ] );
		return {
			id: formField.id,
			children: [],
			field: normalizedField,
		} as FormFieldToValidate< Item >;
	}

	const toValidate = normalizedForm.fields
		.map( processFormField )
		.filter( ( field ) => field !== null );

	return toValidate;
}

function setValidityAtPath(
	formValidity: FormValidity | undefined,
	fieldValidity: FieldValidity,
	path: string[]
): FormValidity {
	// Handle empty validity or empty path
	if ( ! formValidity ) {
		formValidity = {};
	}

	if ( path.length === 0 ) {
		return formValidity;
	}

	// Clone the root to avoid mutations
	const result = { ...formValidity };

	// Navigate through the result tree,
	// setting up empty paths if they don't exist.
	let current: any = result;
	for ( let i = 0; i < path.length - 1; i++ ) {
		const segment = path[ i ];
		if ( ! current[ segment ] ) {
			current[ segment ] = {};
		}

		current = current[ segment ];
	}

	// At the final destination, merge the new validity with the existing.
	const finalKey = path[ path.length - 1 ];
	current[ finalKey ] = {
		...( current[ finalKey ] || {} ),
		...fieldValidity,
	};

	return result;
}

function handleElementsValidationAsync< Item >(
	promise: Promise< any >,
	formField: FormFieldToValidate< Item >,
	promiseHandler: PromiseHandler< Item >
) {
	const { elementsCounterRef, setFormValidity, path, item } = promiseHandler;
	const currentToken =
		( elementsCounterRef.current[ formField.id ] || 0 ) + 1;
	elementsCounterRef.current[ formField.id ] = currentToken;

	promise
		.then( ( result ) => {
			if ( currentToken !== elementsCounterRef.current[ formField.id ] ) {
				return;
			}

			if ( ! Array.isArray( result ) ) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							elements: {
								type: 'invalid',
								message: __( 'Could not validate elements.' ),
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
				return;
			}

			const validValues = result.map( ( el ) => el.value );
			if (
				!! formField.field &&
				formField.field.type !== 'array' &&
				! validValues.includes( formField.field.getValue( { item } ) )
			) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							elements: {
								type: 'invalid',
								message: __(
									'Value must be one of the elements.'
								),
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
				return;
			}

			if (
				!! formField.field &&
				formField.field.type === 'array' &&
				! Array.isArray( formField.field.getValue( { item } ) )
			) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							elements: {
								type: 'invalid',
								message: __( 'Value must be an array.' ),
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
				return;
			}

			if (
				!! formField.field &&
				formField.field.type === 'array' &&
				formField.field
					.getValue( { item } )
					.some( ( v: any ) => ! validValues.includes( v ) )
			) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							elements: {
								type: 'invalid',
								message: __(
									'Value must be one of the elements.'
								),
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
			}
		} )
		.catch( ( error ) => {
			if ( currentToken !== elementsCounterRef.current[ formField.id ] ) {
				return;
			}

			let errorMessage;
			if ( error instanceof Error ) {
				errorMessage = error.message;
			} else {
				errorMessage =
					String( error ) ||
					__(
						'Unknown error when running elements validation asynchronously.'
					);
			}

			setFormValidity( ( prev ) => {
				const newFormValidity = setValidityAtPath(
					prev,
					{
						elements: {
							type: 'invalid',
							message: errorMessage,
						},
					},
					[ ...path, formField.id ]
				);
				return newFormValidity;
			} );
		} );
}

function handleCustomValidationAsync< Item >(
	promise: Promise< any >,
	formField: FormFieldToValidate< Item >,
	promiseHandler: PromiseHandler< Item >
) {
	const { customCounterRef, setFormValidity, path } = promiseHandler;
	const currentToken = ( customCounterRef.current[ formField.id ] || 0 ) + 1;
	customCounterRef.current[ formField.id ] = currentToken;

	promise
		.then( ( result ) => {
			if ( currentToken !== customCounterRef.current[ formField.id ] ) {
				return;
			}

			if ( result === null ) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							custom: {
								type: 'valid',
								message: __( 'Valid' ),
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
				return;
			}

			if ( typeof result === 'string' ) {
				setFormValidity( ( prev ) => {
					const newFormValidity = setValidityAtPath(
						prev,
						{
							custom: {
								type: 'invalid',
								message: result,
							},
						},
						[ ...path, formField.id ]
					);
					return newFormValidity;
				} );
				return;
			}

			setFormValidity( ( prev ) => {
				const newFormValidity = setValidityAtPath(
					prev,
					{
						custom: {
							type: 'invalid',
							message: __( 'Validation could not be processed.' ),
						},
					},
					[ ...path, formField.id ]
				);
				return newFormValidity;
			} );
		} )
		.catch( ( error ) => {
			if ( currentToken !== customCounterRef.current[ formField.id ] ) {
				return;
			}

			let errorMessage;
			if ( error instanceof Error ) {
				errorMessage = error.message;
			} else {
				errorMessage =
					String( error ) ||
					__(
						'Unknown error when running custom validation asynchronously.'
					);
			}

			setFormValidity( ( prev ) => {
				const newFormValidity = setValidityAtPath(
					prev,
					{
						custom: {
							type: 'invalid',
							message: errorMessage,
						},
					},
					[ ...path, formField.id ]
				);
				return newFormValidity;
			} );
		} );
}

type PromiseHandler< Item > = {
	customCounterRef: React.MutableRefObject< Record< string, number > >;
	elementsCounterRef: React.MutableRefObject< Record< string, number > >;
	setFormValidity: React.Dispatch< React.SetStateAction< FormValidity > >;
	path: string[];
	item: Item;
};

function validateFormField< Item >(
	item: Item,
	formField: FormFieldToValidate< Item >,
	promiseHandler: PromiseHandler< Item >
): FieldValidity | undefined {
	// Validate the field: isValid.required
	if (
		!! formField.field &&
		formField.field.isValid.required &&
		isInvalidForRequired(
			formField.field.type,
			formField.field.getValue( { item } )
		)
	) {
		return {
			required: { type: 'invalid' },
		};
	}

	// Validate the field: isValid.elements (static)
	if (
		!! formField.field &&
		formField.field.isValid.elements &&
		formField.field.hasElements &&
		! formField.field.getElements &&
		Array.isArray( formField.field.elements )
	) {
		const value = formField.field.getValue( { item } );
		const validValues = formField.field.elements.map( ( el ) => el.value );

		if (
			formField.field.type !== 'array' &&
			! validValues.includes( value )
		) {
			return {
				elements: {
					type: 'invalid',
					message: __( 'Value must be one of the elements.' ),
				},
			};
		}

		if ( formField.field.type === 'array' && ! Array.isArray( value ) ) {
			return {
				elements: {
					type: 'invalid',
					message: __( 'Value must be an array.' ),
				},
			};
		}
		if (
			formField.field.type === 'array' &&
			value.some( ( v: any ) => ! validValues.includes( v ) )
		) {
			return {
				elements: {
					type: 'invalid',
					message: __( 'Value must be one of the elements.' ),
				},
			};
		}
	}

	// Validate the field: isValid.elements (async)
	if (
		!! formField.field &&
		formField.field.isValid.elements &&
		formField.field.hasElements &&
		typeof formField.field.getElements === 'function'
	) {
		handleElementsValidationAsync(
			formField.field.getElements(),
			formField,
			promiseHandler
		);

		return {
			elements: {
				type: 'validating',
				message: __( 'Validating…' ),
			},
		};
	}

	// Validate the field: isValid.custom (sync)
	let customError;
	if ( !! formField.field ) {
		try {
			const value = formField.field.getValue( { item } );
			customError = formField.field.isValid?.custom?.(
				deepMerge(
					item,
					formField.field.setValue( {
						item,
						value,
					} ) as Partial< Item >
				),
				formField.field
			);
		} catch ( error ) {
			let errorMessage;
			if ( error instanceof Error ) {
				errorMessage = error.message;
			} else {
				errorMessage =
					String( error ) ||
					__( 'Unknown error when running custom validation.' );
			}

			return {
				custom: {
					type: 'invalid',
					message: errorMessage,
				},
			};
		}
	}

	if ( typeof customError === 'string' ) {
		return {
			custom: {
				type: 'invalid',
				message: customError,
			},
		};
	}

	// Validate the field: isValid.custom (async)
	if ( customError instanceof Promise ) {
		handleCustomValidationAsync( customError, formField, promiseHandler );

		return {
			custom: {
				type: 'validating',
				message: __( 'Validating…' ),
			},
		};
	}

	// Validate its children.
	if ( formField.children.length > 0 ) {
		const result: Record< string, FieldValidity | undefined > = {};
		formField.children.forEach( ( child ) => {
			result[ child.id ] = validateFormField( item, child, {
				...promiseHandler,
				path: [ ...promiseHandler.path, formField.id, 'children' ],
			} );
		} );

		const filteredResult: Record< string, FieldValidity > = {};
		Object.entries( result ).forEach( ( [ key, value ] ) => {
			if ( value !== undefined ) {
				filteredResult[ key ] = value;
			}
		} );

		if ( Object.keys( filteredResult ).length === 0 ) {
			return undefined;
		}

		return {
			children: filteredResult,
		};
	}

	// No errors for this field or its children.
	return undefined;
}

function getFormFieldValue< Item >(
	formField: FormFieldToValidate< Item >,
	item: Item
): any {
	const fieldValue = formField?.field?.getValue( { item } );
	if ( formField.children.length === 0 ) {
		return fieldValue;
	}

	const childrenValues = formField.children.map( ( child ) =>
		getFormFieldValue( child, item )
	);
	if ( ! childrenValues ) {
		return fieldValue;
	}

	return {
		value: fieldValue,
		children: childrenValues,
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
	const customCounterRef = useRef< Record< string, number > >( {} );
	const elementsCounterRef = useRef< Record< string, number > >( {} );
	const previousValuesRef = useRef< Record< string, any > >( {} );

	const validate = useCallback( () => {
		const promiseHandler = {
			customCounterRef,
			elementsCounterRef,
			setFormValidity,
			path: [],
			item,
		};

		const formFieldsToValidate = getFormFieldsToValidate( form, fields );
		if ( formFieldsToValidate.length === 0 ) {
			setFormValidity( undefined );
			return;
		}

		const newFormValidity: FormValidity = {};
		const untouchedFields: string[] = [];
		formFieldsToValidate.forEach( ( formField ) => {
			// Skip fields that did not change.
			const value = getFormFieldValue< Item >( formField, item );
			if (
				previousValuesRef.current.hasOwnProperty( formField.id ) &&
				fastDeepEqual(
					previousValuesRef.current[ formField.id ],
					value
				)
			) {
				untouchedFields.push( formField.id );
				return;
			}
			previousValuesRef.current[ formField.id ] = value;

			// Calculate validity for those fields that changed.
			const fieldValidity = validateFormField(
				item,
				formField,
				promiseHandler
			);
			if ( fieldValidity !== undefined ) {
				newFormValidity[ formField.id ] = fieldValidity;
			}
		} );

		setFormValidity( ( existingFormValidity ) => {
			let validity: FormValidity = {
				...existingFormValidity,
				...newFormValidity,
			};

			const fieldsToKeep = [
				...untouchedFields,
				...Object.keys( newFormValidity ),
			];
			Object.keys( validity ).forEach( ( key ) => {
				if ( validity && ! fieldsToKeep.includes( key ) ) {
					delete validity[ key ];
				}
			} );
			if ( Object.keys( validity ).length === 0 ) {
				validity = undefined;
			}

			const areEqual = fastDeepEqual( existingFormValidity, validity );
			if ( areEqual ) {
				return existingFormValidity;
			}

			return validity;
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
