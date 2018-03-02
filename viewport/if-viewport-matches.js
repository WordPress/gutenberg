/**
 * WordPress dependencies
 */
import { compose, getWrapperDisplayName } from '@wordpress/element';
import { ifCondition } from '@wordpress/components';

/**
 * Internal dependencies
 */
import withViewportMatch from './with-viewport-match';

/**
 * Higher-order component creator, creating a new component which renders if
 * the viewport query is satisfied.
 *
 * @param {string} query Viewport query.
 *
 * @see withViewportMatches
 *
 * @return {Function} Higher-order component.
 */
const ifViewportMatches = ( query ) => ( WrappedComponent ) => {
	const EnhancedComponent = compose( [
		withViewportMatch( {
			isViewportMatch: query,
		} ),
		ifCondition( ( props ) => props.isViewportMatch ),
	] )( WrappedComponent );

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifViewportMatches' );

	return EnhancedComponent;
};

export default ifViewportMatches;
