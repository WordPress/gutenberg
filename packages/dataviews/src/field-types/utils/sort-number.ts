/**
 * Internal dependencies
 */
import type { SortDirection } from '../../types';

export default ( a: any, b: any, direction: SortDirection ) => {
	return direction === 'asc' ? a - b : b - a;
};
