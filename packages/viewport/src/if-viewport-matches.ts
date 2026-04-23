/**
 * WordPress dependencies
 */
import {
	ifCondition,
	compose,
	createHigherOrderComponent,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withViewportMatch from './with-viewport-match';
import type { ViewportQuery } from './types';

/**
 * Higher-order component creator, creating a new component which renders if
 * the viewport query is satisfied.
 *
 * @see withViewportMatches
 *
 * @param query Viewport query.
 *
 * @example
 *
 * ```jsx
 * function MyMobileComponent() {
 * 	return <div>I'm only rendered on mobile viewports!</div>;
 * }
 *
 * MyMobileComponent = ifViewportMatches( '< small' )( MyMobileComponent );
 * ```
 *
 * @return Higher-order component.
 */
const ifViewportMatches = ( query: ViewportQuery ) =>
	createHigherOrderComponent(
		( compose as any )( [
			withViewportMatch( {
				isViewportMatch: query,
			} ),
			ifCondition(
				( props: { isViewportMatch: boolean } ) => props.isViewportMatch
			),
		] ),
		'ifViewportMatches'
	);

export default ifViewportMatches;
