import { isValid as isValidDate } from 'date-fns';
import { getDate } from '@wordpress/date';
import type { NormalizedField } from '../../types';
import parseTime from './parse-time';

type Boundary = 'min' | 'max';

function parseDateLike( value: string ): number | null {
	// Pre-check to avoid passing unparseable strings to getDate,
	// which uses moment.js and emits deprecation warnings.
	if ( ! isValidDate( new Date( value ) ) ) {
		return null;
	}

	const parsed = getDate( value );
	return parsed && isValidDate( parsed ) ? parsed.getTime() : null;
}

/**
 * Checks a field's value against its `min` or `max` constraint.
 *
 * `parse` reduces both the value and the constraint to comparable numbers, and
 * keeps each field type to its own reading of them: a calendar value never
 * satisfies a time-of-day constraint, or the reverse.
 *
 * @param item     The item holding the value.
 * @param field    The field to validate.
 * @param boundary Which constraint to check.
 * @param parse    Reduces a value to a comparable number, or `null` if it is
 *                 not one this field type can read.
 * @return         Whether the value is within the constraint.
 */
function validateBoundary< Item >(
	item: Item,
	field: NormalizedField< Item >,
	boundary: Boundary,
	parse: ( value: string ) => number | null
): boolean {
	const constraint = field.isValid[ boundary ]?.constraint;
	if ( typeof constraint !== 'string' ) {
		return false;
	}

	const value = field.getValue( { item } );
	// A range is bounded by whichever of its ends faces the constraint.
	const boundaryValue = Array.isArray( value )
		? value[ boundary === 'min' ? 0 : value.length - 1 ]
		: value;

	if (
		boundaryValue === undefined ||
		boundaryValue === null ||
		boundaryValue === ''
	) {
		return true;
	}

	const parsedConstraint = parse( constraint );
	const parsedValue = parse( String( boundaryValue ) );
	if ( parsedConstraint === null || parsedValue === null ) {
		return false;
	}

	return boundary === 'min'
		? parsedValue >= parsedConstraint
		: parsedValue <= parsedConstraint;
}

export function isValidMinDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateBoundary( item, field, 'min', parseDateLike );
}

export function isValidMaxDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateBoundary( item, field, 'max', parseDateLike );
}

export function isValidMinTime< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateBoundary( item, field, 'min', parseTime );
}

export function isValidMaxTime< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateBoundary( item, field, 'max', parseTime );
}
