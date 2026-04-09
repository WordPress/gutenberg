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

	let min;
	if (
		( typeof rules?.min === 'number' ||
			typeof rules?.min === 'string' ) &&
		fieldType.validate.min !== undefined
	) {
		min = {
			constraint: rules!.min,
			validate: fieldType.validate.min,
		};
	}

	let max;
	if (
		( typeof rules?.max === 'number' ||
			typeof rules?.max === 'string' ) &&
		fieldType.validate.max !== undefined
	) {
		max = {
			constraint: rules!.max,
			validate: fieldType.validate.max,
		};
	}

	let minLength;
	if (
		typeof rules?.minLength === 'number' &&
		fieldType.validate.minLength !== undefined
	) {
		minLength = {
			constraint: rules!.minLength,
			validate: fieldType.validate.minLength,
		};
	}

	let maxLength;
	if (
		typeof rules?.maxLength === 'number' &&
		fieldType.validate.maxLength !== undefined
	) {
		maxLength = {
			constraint: rules!.maxLength,
			validate: fieldType.validate.maxLength,
		};
	}

	let pattern;
	if (
		rules?.pattern !== undefined &&
		fieldType.validate.pattern !== undefined
	) {
		pattern = {
			constraint: rules?.pattern,
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
