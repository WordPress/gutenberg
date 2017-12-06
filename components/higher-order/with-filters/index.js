/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Creates a higher-order component which adds filtering capability to the wrapped component.
 *
 * @param {String} hookName Hook name exposed to be used by filters.
 * @return {Function}      Higher-order component factory.
 */
export default function withFilters( hookName ) {
	return ( OriginalComponent ) => {
		return applyFilters( hookName, OriginalComponent );
	};
}
