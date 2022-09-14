/**
 * External dependencies
 */
import { options } from 'preact';

// WordPress Directives.
const directives = {};

// Make them extensible.
export const directive = ( name, cb ) => {
	directives[ name ] = cb;
};

// Preact Option Hooks. See https://preactjs.com/guide/v10/options/
const hooks = [
	[ 'vnode', 'onCreate', 'vnode' ],
	[ '__b', 'onDiff', 'diff' ],
	[ 'diffed', 'onDiffed', 'diffed' ],
	[ 'unmount', 'onUnmount', 'unmount' ],
	[ '__r', 'onRender', 'render' ],
	[ '__h', 'onHook', 'hook' ],
	[ '__e', 'onCatchError', 'catchError' ],
	[ '__c', 'onCommit', 'commit' ],
];

// Run the directive callbacks.
hooks.forEach( ( [ key, hook ] ) => {
	const old = options[ key ];
	options[ key ] = ( vnode ) => {
		const wp = vnode.props.wp;
		if ( wp ) {
			for ( const d in wp ) {
				// For each directive, run the callback.
				directives[ d ]?.[ hook ]?.( vnode );
			}
		}
		if ( old ) old( vnode );
	};
} );
