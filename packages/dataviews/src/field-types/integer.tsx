/**
 * Internal dependencies
 */
import type { SortDirection } from '../types';

export default {
	sort: ( a: number, b: number, direction: SortDirection ) =>
		direction === 'asc' ? a - b : b - a,
};
