/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

function sort( a: any, b: any, direction: SortDirection ) {
	return direction === 'asc' ? a - b : b - a;
}

export default {
	sort,
};
