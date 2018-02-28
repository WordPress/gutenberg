/**
 * WordPress dependencies
 */
import { compose, getWrapperDisplayName } from '@wordpress/element';

// TEMPORARY: A circular dependency exists between `@wordpress/components`
// and `@wordpress/viewport` (Popover -> withViewportMatch, ifViewportMatches
// -> ifCondition).

// import { ifCondition } from '@wordpress/components';
const ifCondition = ( predicate ) => ( WrappedComponent ) => {
	const EnhancedComponent = ( props ) => {
		if ( ! predicate( props ) ) {
			return null;
		}

		return <WrappedComponent { ...props } />;
	};

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifCondition' );

	return EnhancedComponent;
};

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
