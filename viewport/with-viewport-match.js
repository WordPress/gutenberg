/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Higher-order component creator, creating a new component which renders with
 * the given prop names, where the value passed to the underlying compoennt is
 * the result of the query assigned as the object's value.
 *
 * @param {Object} queries  Object of prop name to viewport query.
 * @param {string} propName Optional prop name to which result is assigned.
 *
 * @see isViewportMatch
 *
 * @return {Function} Higher-order component.
 */
const withViewportMatch = ( queries ) => ( WrappedComponent ) => {
	const EnhancedComponent = withSelect( ( select ) => {
		return mapValues( queries, ( query ) => {
			return select( 'core/viewport' ).isViewportMatch( query );
		} );
	} )( WrappedComponent );

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'withViewportMatch' );

	return EnhancedComponent;
};

export default withViewportMatch;
