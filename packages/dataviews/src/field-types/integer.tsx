/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

function sort< Item >(
	itemA: Item,
	itemB: Item,
	direction: SortDirection,
	getValue: ( args: { item: Item } ) => any
) {
	const valueA = getValue( { item: itemA } );
	const valueB = getValue( { item: itemB } );

	return direction === 'asc' ? valueA - valueB : valueB - valueA;
}

export default {
	sort,
};
