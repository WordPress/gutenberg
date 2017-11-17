/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import wrapperDisplayName from '../wrapper-display-name';

export default function withFilters( hookName ) {
	return ( WrappedComponent ) => {
		const FiltersComponent = ( props ) => {
			return applyFilters( hookName, <WrappedComponent { ...props } />, props );
		};
		FiltersComponent.displayName = wrapperDisplayName( 'filters', WrappedComponent );

		return FiltersComponent;
	};
}
