/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function filterBetween< Item >(
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
): boolean {
	if (
		! Array.isArray( filterValue ) ||
		filterValue.length !== 2 ||
		filterValue[ 0 ] === undefined ||
		filterValue[ 1 ] === undefined
	) {
		return true;
	}

	const fieldValue = field.getValue( { item } );

	if (
		typeof fieldValue === 'number' ||
		fieldValue instanceof Date ||
		typeof fieldValue === 'string'
	) {
		return fieldValue >= filterValue[ 0 ] && fieldValue <= filterValue[ 1 ];
	}

	return false;
}
