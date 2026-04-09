/**
 * Internal dependencies
 */
import type { Field, NormalizedRules } from '../../types';
import type { FieldType } from '../../types/private';

function supportsNumericRangeConstraint( type?: string ) {
	return type === 'integer' || type === 'number';
}

function supportsDateRangeConstraint( type?: string ) {
	return type === 'date' || type === 'datetime';
}

function normalizeRangeRule< Item >(
	value: number | string | undefined,
	fieldType: FieldType< Item >,
	key: 'min' | 'max'
): NormalizedRules< Item >[ 'min' ] {
	const validator = fieldType.validate[ key ];
	if (
		validator &&
		( ( typeof value === 'number' &&
			supportsNumericRangeConstraint( fieldType.type ) ) ||
			( typeof value === 'string' &&
				supportsDateRangeConstraint( fieldType.type ) ) )
	) {
		return { constraint: value, validate: validator } as NonNullable<
			NormalizedRules< Item >[ typeof key ]
		>;
	}
	return undefined;
}

export default function getIsValid< Item >(
	field: Field< Item >,
	fieldType: FieldType< Item >
): NormalizedRules< Item > {
	const rules = field.isValid;
	let required;
	if (
		rules?.required === true &&
		fieldType.validate.required !== undefined
	) {
		required = {
			constraint: true,
			validate: fieldType.validate.required,
		};
	}

	let elements;
	if (
		( rules?.elements === true ||
			// elements is enabled unless the field opts-out
			( rules?.elements === undefined &&
				( !! field.elements || !! field.getElements ) ) ) &&
		fieldType.validate.elements !== undefined
	) {
		elements = {
			constraint: true,
			validate: fieldType.validate.elements,
		};
	}

	const min = normalizeRangeRule( rules?.min, fieldType, 'min' );
	const max = normalizeRangeRule( rules?.max, fieldType, 'max' );

	const minLengthValue = rules?.minLength;
	let minLength;
	if (
		typeof minLengthValue === 'number' &&
		fieldType.validate.minLength !== undefined
	) {
		minLength = {
			constraint: minLengthValue,
			validate: fieldType.validate.minLength,
		};
	}

	const maxLengthValue = rules?.maxLength;
	let maxLength;
	if (
		typeof maxLengthValue === 'number' &&
		fieldType.validate.maxLength !== undefined
	) {
		maxLength = {
			constraint: maxLengthValue,
			validate: fieldType.validate.maxLength,
		};
	}

	const patternValue = rules?.pattern;
	let pattern;
	if (
		patternValue !== undefined &&
		fieldType.validate.pattern !== undefined
	) {
		pattern = {
			constraint: patternValue,
			validate: fieldType.validate.pattern,
		};
	}

	const custom = rules?.custom ?? fieldType.validate.custom;

	return {
		required,
		elements,
		min,
		max,
		minLength,
		maxLength,
		pattern,
		custom,
	};
}
