/**
 * Internal dependencies
 */
import type { Field, NormalizedRules } from '../../types';
import type { FieldType } from '../../types/private';

export default function getIsValid< Item >(
	field: Field< Item >,
	fieldType: FieldType< Item >
): NormalizedRules< Item > {
	let required;
	if (
		field.isValid?.required === true &&
		fieldType.validate.required !== undefined
	) {
		required = {
			constraint: true,
			validate: fieldType.validate.required,
		};
	}

	let elements;
	if (
		( field.isValid?.elements === true ||
			// elements is enabled unless the field opts-out
			( field.isValid?.elements === undefined &&
				( !! field.elements || !! field.getElements ) ) ) &&
		fieldType.validate.elements !== undefined
	) {
		elements = {
			constraint: true,
			validate: fieldType.validate.elements,
		};
	}

	let min;
	if (
		typeof field.isValid?.min === 'number' &&
		fieldType.validate.min !== undefined
	) {
		min = {
			constraint: field.isValid.min,
			validate: fieldType.validate.min,
		};
	}

	let max;
	if (
		typeof field.isValid?.max === 'number' &&
		fieldType.validate.max !== undefined
	) {
		max = {
			constraint: field.isValid.max,
			validate: fieldType.validate.max,
		};
	}

	let minLength;
	if (
		typeof field.isValid?.minLength === 'number' &&
		fieldType.validate.minLength !== undefined
	) {
		minLength = {
			constraint: field.isValid.minLength,
			validate: fieldType.validate.minLength,
		};
	}

	let maxLength;
	if (
		typeof field.isValid?.maxLength === 'number' &&
		fieldType.validate.maxLength !== undefined
	) {
		maxLength = {
			constraint: field.isValid.maxLength,
			validate: fieldType.validate.maxLength,
		};
	}

	let pattern;
	if (
		field.isValid?.pattern !== undefined &&
		fieldType.validate.pattern !== undefined
	) {
		pattern = {
			constraint: field.isValid?.pattern,
			validate: fieldType.validate.pattern,
		};
	}

	const custom = field.isValid?.custom ?? fieldType.validate.custom;

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
