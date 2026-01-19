/**
 * WordPress dependencies
 */
import { getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';
import getRelativeDate from './get-relative-date';

export default function filterInThePast< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( filterValue?.value === undefined || filterValue?.unit === undefined ) {
		return true;
	}

	const targetDate = getRelativeDate( filterValue.value, filterValue.unit );
	const fieldValue = getDate( field.getValue( { item } ) );

	return fieldValue >= targetDate && fieldValue <= new Date();
}
