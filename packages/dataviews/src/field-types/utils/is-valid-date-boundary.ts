/**
 * External dependencies
 */
import { isValid as isValidDate } from 'date-fns';

/**
 * WordPress dependencies
 */
import { getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

type Boundary = 'min' | 'max';

function parseDateLike( value?: string ) {
	if ( ! value ) {
		return null;
	}

	// Pre-check to avoid passing unparseable strings to getDate,
	// which uses moment.js and emits deprecation warnings.
	if ( ! isValidDate( new Date( value ) ) ) {
		return null;
	}

	const parsed = getDate( value );
	return parsed && isValidDate( parsed ) ? parsed : null;
}

function validateDateLikeBoundary< Item >(
	item: Item,
	field: NormalizedField< Item >,
	boundary: Boundary
): boolean {
	const constraint = field.isValid[ boundary ]?.constraint;
	if ( typeof constraint !== 'string' ) {
		return false;
	}

	const value = field.getValue( { item } );
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

	const parsedConstraint = parseDateLike( constraint );
	const parsedValue = parseDateLike( String( boundaryValue ) );

	return (
		!! parsedConstraint &&
		!! parsedValue &&
		( boundary === 'min'
			? parsedValue.getTime() >= parsedConstraint.getTime()
			: parsedValue.getTime() <= parsedConstraint.getTime() )
	);
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
