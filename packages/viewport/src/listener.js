/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
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
			const values = Object.fromEntries(
				queries.map( ( [ key, query ] ) => [ key, query.matches ] )
			);
			dispatch( store ).setIsMatching( values );
		},
		0,
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
	const operatorEntries = Object.entries( operators );
	const queries = Object.entries( breakpoints ).flatMap(
		( [ name, width ] ) => {
			return operatorEntries.map( ( [ operator, condition ] ) => {
				const list = window.matchMedia(
					`(${ condition }: ${ width }px)`
				);
				list.addEventListener( 'change', setIsMatching );
				return [ `${ operator } ${ name }`, list ];
			} );
		}
	);

	window.addEventListener( 'orientationchange', setIsMatching );

	// Set initial values.
	setIsMatching();
	setIsMatching.flush();
};

export default addDimensionsEventListener;
