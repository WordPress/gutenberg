/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

function sort< Item >(
	a: {
		item: Item;
		value: any;
	},
	b: {
		item: Item;
		value: any;
	},
	direction: SortDirection
) {
	return direction === 'asc' ? a.value - b.value : b.value - a.value;
}

export default {
	sort,
};
