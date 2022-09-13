/**
 * External dependencies
 */
import { h, hydrate, render, options } from 'preact';

// For wrapperless hydration of document.body.
// See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
function createRootFragment( parent, replaceNode ) {
	replaceNode = [].concat( replaceNode );
	const s = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( c, r ) {
		parent.insertBefore( c, r || s );
	}
	return ( parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c ) {
			parent.removeChild( c );
		},
	} );
}

let rootFragment;

// Helper function to await until the CPU is idle.
const idle = () =>
	new Promise( ( resolve ) => window.requestIdleCallback( resolve ) );

// Helper function to rename the WordPress Directives from `wp-xx-yy` to `xxYY`.
const renameDirective = ( s ) =>
	s
		.toLowerCase()
		.replace( /^wp-/, '' )
		.replace( /-(.)/g, ( _, chr ) => chr.toUpperCase() );

// Convert DOM nodes to static virtual DOM nodes.
function toVdom( node ) {
	if ( node.nodeType === 3 ) {
		return node.data;
	}
	if ( node.nodeType === 8 || node.localName === 'script' ) {
		return null;
	}

	const props = {},
		a = node.attributes;

	for ( let i = 0; i < a.length; i++ ) {
		if ( a[ i ].name.startsWith( 'wp-' ) ) {
			props.wp = props.wp || {};
			let value = a[ i ].value;
			try {
				value = JSON.parse( value );
			} catch ( e ) {}
			props.wp[ renameDirective( a[ i ].name ) ] = value;
		} else {
			props[ a[ i ].name ] = a[ i ].value;
		}
	}

	return h(
		node.localName,
		props,
		[].map.call( node.childNodes, toVdom ).filter( exists )
	);
}
const exists = ( i ) => i;

/* A minimalistic Router */

// The cache of visited or prefetched pages.
const pages = new Map();

// Fetch a new page and convert it to a static virtual DOM.
const fetchAndVdom = async ( url ) => {
	const html = await window.fetch( url ).then( ( res ) => res.text() );
	await idle();
	const dom = new window.DOMParser().parseFromString( html, 'text/html' );
	return toVdom( dom.body );
};

// Retrieve a page from the cache or trigger a new fetch. We store promises to
// avoid fetching a page if a fetching has already started.
const fetchPage = async ( url ) => {
	if ( ! pages.has( url ) ) {
		pages.set( url, fetchAndVdom( url ) );
	}
	return await pages.get( url );
};

// Convert the initial DOM into a static virtual DOM and save it in the cache.
const getInitialVdom = () => {
	const vdom = toVdom( document.body );
	const url = window.location.pathname + window.location.search;
	pages.set( url, Promise.resolve( vdom ) );
	return vdom;
};

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
window.addEventListener( 'popstate', async () => {
	const url = window.location.pathname + window.location.search;
	if ( pages.has( url ) ) {
		const vdom = await pages.get( url );
		render( vdom, rootFragment );
	}
} );

/* WordPress Directives */
const wpDirectives = {};

// The `wp-client-navigation` directive.
wpDirectives.clientNavigation = {
	onDiff: ( { props } ) => {
		const {
			wp: { clientNavigation },
			href,
		} = props;

		// Prefetch the page if it is in the directive options.
		if ( clientNavigation?.prefetch ) {
			fetchPage( href );
		}

		// Don't do anything if it's falsy.
		if ( !! clientNavigation ) {
			props.onclick = async ( event ) => {
				event.preventDefault();

				// Fetch the page (or return it from cache).
				const vdom = await fetchPage( href );
				// Render the new page.
				render( vdom, rootFragment );

				// Update the URL.
				window.history.pushState( {}, '', href );

				// Update the scroll, depending on the option. True by default.
				if ( clientNavigation?.scroll === 'smooth' ) {
					window.scrollTo( { top: 0, left: 0, behavior: 'smooth' } );
				} else if ( clientNavigation?.scroll !== false ) {
					window.scrollTo( 0, 0 );
				}
			};
		}
	},
};

// Preact Option Hooks. See https://preactjs.com/guide/v10/options/
const hooks = {
	vnode: [ 'vnode', 'onCreate' ],
	diff: [ '__b', 'onDiff' ],
	diffed: [ 'diffed', 'onDiffed' ],
	unmount: [ 'unmount', 'onUnmount' ],
	// render: [ '__r', 'onRender' ],
	// hook: [ '__h', 'onHook' ],
	// catchError: [ '__e', 'onCatchError' ],
	// commit: [ '__c', 'onCommit' ],
};

// Run the directive callbacks.
Object.entries( hooks ).forEach( ( [ name, [ key, hook ] ] ) => {
	const old = options[ key ];
	options[ key ] = ( vnode ) => {
		const wp = vnode.props.wp;
		if ( wp ) {
			// eslint-disable-next-line no-console
			console.log( name, vnode );
			for ( const directive in wp ) {
				// For each directive, run the callback.
				wpDirectives[ directive ]?.[ hook ]?.( vnode );
			}
		}
		if ( old ) old( vnode );
	};
} );

document.addEventListener( 'DOMContentLoaded', async () => {
	// Create the root fragment to hydrate everything.
	rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);

	// Wait until the CPU is idle to do the hydration.
	await idle();
	const vdom = getInitialVdom();
	hydrate( vdom, rootFragment );
	// eslint-disable-next-line no-console
	console.log( 'hydrated!' );
} );
