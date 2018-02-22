/**
 * WordPress dependencies
 */
import { compose, getWrapperDisplayName } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { ifCondition } from '@wordpress/components';

/**
 * Higher-order component creator, creating a new component which renders if
 * the viewport query is satisfied or with the given optional prop name.
 *
 * @param {string}  query    Viewport query.
 * @param {?string} propName Optional prop name passed to component with result
 *                           of query match. If provided, component will always
 *                           render even if viewport does not match.
 *
 * @see isViewportMatch
 *
 * @return {Function} Higher-order component.
 */
const ifViewportMatches = ( query, propName ) => ( WrappedComponent ) => {
	const EnhancedComponent = compose( [
		withSelect( ( select ) => ( {
			isViewportSize: select( 'core/viewport' ).isViewportMatch( query ),
		} ) ),
		ifCondition( ( props ) => props.isViewportSize, propName ),
	] )( WrappedComponent );

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'viewportSize' );

	return EnhancedComponent;
};

export default ifViewportMatches;
