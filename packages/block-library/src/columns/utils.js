/**
 * External dependencies
 */
import memoize from 'memize';
import { times } from 'lodash';

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */
export const getColumnsTemplate = memoize( ( columns ) => {
	return times( columns, () => [ 'core/column' ] );
} );
