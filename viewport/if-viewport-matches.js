/**
 * WordPress dependencies
 */
import { ifCondition, compose, createHigherOrderComponent } from '@wordpress/compose';

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
const ifViewportMatches = ( query ) => createHigherOrderComponent(
	compose( [
		withViewportMatch( {
			isViewportMatch: query,
		} ),
		ifCondition( ( props ) => props.isViewportMatch ),
	] ),
	'ifViewportMatches'
);

export default ifViewportMatches;
