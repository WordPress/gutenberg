/**
 * WordPress dependencies
 */
import { Component, getWrapperDisplayName } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Creates a higher-order component which adds filtering capability to the
 * wrapped component. Filters get applied when the original component is about
 * to be mounted.
 *
 * @param {string} hookName Hook name exposed to be used by filters.
 *
 * @returns {Function} Higher-order component factory.
 */
export default function withFilters( hookName ) {
	return ( OriginalComponent ) => {
		class FilteredComponent extends Component {
			constructor( props ) {
				super( props );
				this.Component = applyFilters( hookName, OriginalComponent );
			}

			render() {
				return <this.Component { ...this.props } />;
			}
		}
		FilteredComponent.displayName = getWrapperDisplayName( OriginalComponent, 'filters' );

		return FilteredComponent;
	};
}
