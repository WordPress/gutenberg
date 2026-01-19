/**
 * WordPress dependencies
 */
import { getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterBeforeInc< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if ( filterValue === undefined ) {
		return true;
	}

	const filterDate = getDate( filterValue );
	const fieldDate = getDate( field.getValue( { item } ) );

	return fieldDate <= filterDate;
}
