/**
 * External dependencies
 */
import { hydrate, render } from 'preact';

/**
 * Internal dependencies
 */
import { toVdom } from './vdom';

// The root to render the vdom (document.body).
let rootFragment;

// The cache of visited and prefetched pages.
const pages = new Map();

// For wrapperless hydration of document.body.
// See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
const createRootFragment = ( parent, replaceNode ) => {
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
};

// Helper function to await until the CPU is idle.
const idle = () =>
	new Promise( ( resolve ) => window.requestIdleCallback( resolve ) );

// Helper to remove domain and hash from the URL. We are only interesting in
// caching the path and the query.
const cleanUrl = ( url ) => {
	const u = new URL( url, 'http://a.bc' );
	return u.pathname + u.search;
};

// Fetch a new page and convert it to a static virtual DOM.
const fetchPage = async ( url ) => {
	const html = await window.fetch( url ).then( ( res ) => res.text() );
	await idle(); // Wait until CPU is idle to do the parsing and vdom.
	const dom = new window.DOMParser().parseFromString( html, 'text/html' );
	return toVdom( dom.body );
};

// Prefetch a page. We store the promise to avoid triggering a second fetch for
// a page if a fetching has already started.
export const prefetch = ( url ) => {
	url = cleanUrl( url );
	if ( ! pages.has( url ) ) {
		pages.set( url, fetchPage( url ) );
	}
};

// Navigate to a new page.
export const navigate = async ( href ) => {
	const url = cleanUrl( href );
	prefetch( url );
	const vdom = await pages.get( url );
	render( vdom, rootFragment );
	window.history.pushState( { wp: { clientNavigation: true } }, '', href );
};

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
window.addEventListener( 'popstate', async () => {
	const url = cleanUrl( window.location ); // Remove hash.
	if ( pages.has( url ) ) {
		const vdom = await pages.get( url );
		render( vdom, rootFragment );
	} else {
		window.location.reload();
	}
} );

// Initialize the router with the initial DOM.
document.addEventListener( 'DOMContentLoaded', async () => {
	const url = cleanUrl( window.location ); // Remove hash.

	// Create the root fragment to hydrate everything.
	rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);

	await idle(); // Wait until the CPU is idle to do the hydration.
	const vdom = toVdom( document.body );
	pages.set( url, Promise.resolve( vdom ) );
	hydrate( vdom, rootFragment );

	// eslint-disable-next-line no-console
	console.log( 'hydrated!' );
} );
