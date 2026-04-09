/**
 * External dependencies
 */
import { isValid as isValidDate, parseISO } from 'date-fns';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

type Boundary = 'min' | 'max';

function isEmptyValue( value: unknown ) {
	return value === undefined || value === null || value === '';
}

function parseDateLike( value?: string ) {
	if ( ! value ) {
		return null;
	}

	const parsed = parseISO( value );
	return isValidDate( parsed ) ? parsed : null;
}

export function validateDateLikeBoundary< Item >(
	item: Item,
	field: NormalizedField< Item >,
	boundary: Boundary
): boolean {
	const constraint = field.isValid[ boundary ]?.constraint;
	if ( typeof constraint !== 'string' ) {
		return false;
	}

	const value = field.getValue( { item } );
	if ( isEmptyValue( value ) ) {
		return true;
	}

	const boundaryValue = Array.isArray( value )
		? value[ boundary === 'min' ? 0 : value.length - 1 ]
		: value;

	if ( Array.isArray( value ) && value.length === 0 ) {
		return true;
	}

	if ( isEmptyValue( boundaryValue ) ) {
		return true;
	}

	const parsedConstraint = parseDateLike( constraint );
	const parsedValue = parseDateLike( String( boundaryValue ) );

	if ( ! parsedConstraint || ! parsedValue ) {
		return false;
	}

	return boundary === 'min'
		? parsedValue.getTime() >= parsedConstraint.getTime()
		: parsedValue.getTime() <= parsedConstraint.getTime();
}

export function isValidMinDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateDateLikeBoundary( item, field, 'min' );
}

export function isValidMaxDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	return validateDateLikeBoundary( item, field, 'max' );
}
