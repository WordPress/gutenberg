/**
 * External dependencies
 */
import { hydrate } from 'preact';
/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from './vdom';
import { createRootFragment } from './utils';
import { directivePrefix } from './constants';

export const init = async () => {
	document
		.querySelectorAll( `[data-${ directivePrefix }-interactive]` )
		.forEach( ( node ) => {
			if ( ! hydratedIslands.has( node ) ) {
				const fragment = createRootFragment( node.parentNode, node );
				const vdom = toVdom( node );
				hydrate( vdom, fragment );
			}
		} );
};
