/**
 * External dependencies
 */
import { reduce, forEach, debounce, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from './store';

const addDimensionsEventListener = ( breakpoints, operators ) => {
	/**
	 * Callback invoked when media query state should be updated. Is invoked a
	 * maximum of one time per call stack.
	 */
	const setIsMatching = debounce(
		() => {
			const values = mapValues( queries, ( query ) => query.matches );
			dispatch( store ).setIsMatching( values );
		},
		{ leading: true }
	);

	/**
	 * Hash of breakpoint names with generated MediaQueryList for corresponding
	 * media query.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
	 *
	 * @type {Object<string,MediaQueryList>}
	 */
	const queries = reduce(
		breakpoints,
		( result, width, name ) => {
			forEach( operators, ( condition, operator ) => {
				const list = window.matchMedia(
					`(${ condition }: ${ width }px)`
				);
				list.addListener( setIsMatching );

				const key = [ operator, name ].join( ' ' );
				result[ key ] = list;
			} );

			return result;
		},
		{}
	);

	window.addEventListener( 'orientationchange', setIsMatching );

	// Set initial values.
	setIsMatching();
	setIsMatching.flush();
};

export default addDimensionsEventListener;
