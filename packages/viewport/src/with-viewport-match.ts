/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import {
	createHigherOrderComponent,
	pure,
	useViewportMatch,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { ViewportQueries } from './types';

/**
 * Higher-order component creator, creating a new component which renders with
 * the given prop names, where the value passed to the underlying component is
 * the result of the query assigned as the object's value.
 *
 * @see isViewportMatch
 *
 * @param queries Object of prop name to viewport query.
 *
 * @example
 *
 * ```jsx
 * function MyComponent( { isMobile } ) {
 * 	return (
 * 		<div>Currently: { isMobile ? 'Mobile' : 'Not Mobile' }</div>
 * 	);
 * }
 *
 * MyComponent = withViewportMatch( { isMobile: '< small' } )( MyComponent );
 * ```
 *
 * @return Higher-order component.
 */
const withViewportMatch = ( queries: ViewportQueries ) => {
	const queryEntries = Object.entries( queries );
	const useViewPortQueriesResult = () =>
		Object.fromEntries(
			queryEntries.map( ( [ key, query ] ) => {
				let [ operator, breakpointName ] = query.split( ' ' );
				if ( breakpointName === undefined ) {
					breakpointName = operator;
					operator = '>=';
				}
				// Hooks should unconditionally execute in the same order,
				// we are respecting that as from the static query of the HOC we generate
				// a hook that calls other hooks always in the same order (because the query never changes).
				// eslint-disable-next-line react-hooks/rules-of-hooks
				return [
					key,
					( useViewportMatch as any )( breakpointName, operator ),
				];
			} )
		);
	return createHigherOrderComponent(
		( WrappedComponent: ComponentType< any > ) => {
			return ( pure as any )( ( props: any ) => {
				const queriesResult = useViewPortQueriesResult();
				return ( WrappedComponent as any )( {
					...props,
					...queriesResult,
				} );
			} );
		},
		'withViewportMatch'
	);
};

export default withViewportMatch;
