/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

function sort< Item >(
	itemA: Item,
	itemB: Item,
	direction: SortDirection,
	field: any
) {
	const valueA = field.getValue( { item: itemA } );
	const valueB = field.getValue( { item: itemB } );

	return direction === 'asc' ? valueA - valueB : valueB - valueA;
}

export default {
	sort,
};
