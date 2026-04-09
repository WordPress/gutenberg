/**
 * Internal dependencies
 */
import type { Field, Rules, NormalizedRules } from '../../types';
import type { FieldType } from '../../types/private';

export default function getIsValid< Item >(
	field: Field< Item >,
	fieldType: FieldType< Item >
): NormalizedRules< Item > {
	// Cast to Rules (widest type) since this function handles all field types.
	const rules = field.isValid as Rules< Item > | undefined;
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

	const minValue = rules?.min;
	let min;
	if (
		( typeof minValue === 'number' || typeof minValue === 'string' ) &&
		fieldType.validate.min !== undefined
	) {
		min = {
			constraint: minValue,
			validate: fieldType.validate.min,
		};
	}

	const maxValue = rules?.max;
	let max;
	if (
		( typeof maxValue === 'number' || typeof maxValue === 'string' ) &&
		fieldType.validate.max !== undefined
	) {
		max = {
			constraint: maxValue,
			validate: fieldType.validate.max,
		};
	}

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
