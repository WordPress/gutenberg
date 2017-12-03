/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Creates a higher-order component which adds filtering capability to the wrapped component.
 *
 * @param {String} hookName Hook name exposed to be used by filters.
 * @return {Function}      Higher-order component factory.
 */
export default function withFilters( hookName ) {
	return ( WrappedComponent ) => {
		const FiltersComponent = ( props ) => {
			return applyFilters( hookName, <WrappedComponent { ...props } />, props );
		};
		FiltersComponent.displayName = getWrapperDisplayName( WrappedComponent, 'filters' );

		return FiltersComponent;
	};
}
