/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

export default {
	sort: ( itemA: any, itemB: any, direction: SortDirection, field: any ) => {
		const valueA = field.getValue( { item: itemA } );
		const valueB = field.getValue( { item: itemB } );

		return direction === 'asc' ? valueA - valueB : valueB - valueA;
	},
};
