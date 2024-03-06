/**
 * WordPress dependencies
 */
import {
	privateApis,
	store,
	getConfig,
	getElement,
} from '@wordpress/interactivity';

const { createRootFragment, render, toVdom } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// The root to render the vdom (document.body).
let rootFragment;

// The cache of visited and prefetched pages, stylesheets and scripts.
const pages = new Map();
const stylesheets = new Map();
const scripts = new Map();

// Helper to remove domain and hash from the URL. We are only interesting in
// caching the path and the query.
const cleanUrl = ( url ) => {
	const u = new URL( url, window.location );
	return u.pathname + u.search;
};

// Helper to check if a page can do client-side navigation.
const canDoClientSideNavigation = () =>
	getConfig( 'core/router' ).fullClientSideNavigation;

/**
 * Finds the elements in the document that match the selector and fetch them.
 * For each element found, fetch the content and store it in the cache.
 * Returns an array of elements to add to the document.
 *
 * @param {Document}         document
 * @param {string}           selector        - CSS selector used to find the elements.
 * @param {'href'|'src'}     attribute       - Attribute that determines where to fetch
 *                                           the styles or scripts from. Also used as the key for the cache.
 * @param {Map}              cache           - Cache to use for the elements. Can be `stylesheets` or `scripts`.
 * @param {'style'|'script'} elementToCreate - Element to create for each fetched
 *                                           item. Can be 'style' or 'script'.
 * @return {Promise<Array<HTMLElement>>} - Array of elements to add to the document.
 */
const fetchScriptOrStyle = async (
	document,
	selector,
	attribute,
	cache,
	elementToCreate
) => {
	const fetchedItems = await Promise.all(
		[].map.call( document.querySelectorAll( selector ), ( el ) => {
			const attributeValue = el.getAttribute( attribute );
			if ( ! cache.has( attributeValue ) )
				cache.set(
					attributeValue,
					fetch( attributeValue ).then( ( r ) => r.text() )
				);
			return cache.get( attributeValue );
		} )
	);

	return fetchedItems.map( ( item ) => {
		const element = document.createElement( elementToCreate );
		element.textContent = item;
		return element;
	} );
};

// Fetch styles of a new page.
const fetchAssets = async ( document ) => {
	const stylesFromSheets = await fetchScriptOrStyle(
		document,
		'link[rel=stylesheet]',
		'href',
		stylesheets,
		'style'
	);
	const scriptTags = await fetchScriptOrStyle(
		document,
		'script[src]',
		'src',
		scripts,
		'script'
	);
	const moduleScripts = await fetchScriptOrStyle(
		document,
		'script[type=module]',
		'src',
		scripts,
		'script'
	);
	moduleScripts.forEach( ( script ) =>
		script.setAttribute( 'type', 'module' )
	);

	return [
		...scriptTags,
		document.querySelector( 'title' ),
		...document.querySelectorAll( 'style' ),
		...stylesFromSheets,
	];
};

// Fetch a new page and convert it to a static virtual DOM.
const fetchPage = async ( url ) => {
	const html = await window.fetch( url ).then( ( r ) => r.text() );
	if ( ! canDoClientSideNavigation() ) return false;
	const dom = new window.DOMParser().parseFromString( html, 'text/html' );
	const head = await fetchAssets( dom );
	return { head, body: toVdom( dom.body ) };
};

const isValidLink = ( ref ) =>
	ref &&
	ref instanceof window.HTMLAnchorElement &&
	ref.href &&
	( ! ref.target || ref.target === '_self' ) &&
	ref.origin === window.location.origin;

const isValidEvent = ( event ) =>
	event.button === 0 && // Left clicks only.
	! event.metaKey && // Open in new tab (Mac).
	! event.ctrlKey && // Open in new tab (Windows).
	! event.altKey && // Download.
	! event.shiftKey &&
	! event.defaultPrevented;

const { actions } = store( 'core/router', {
	actions: {
		*navigate( event, url ) {
			const { ref } = getElement();

			if ( url || ( isValidLink( ref ) && isValidEvent( event ) ) ) {
				const href = url ? url : ref.href;
				event.preventDefault();
				const newUrl = cleanUrl( href );
				yield actions.prefetch( event, newUrl );
				const page = yield pages.get( newUrl );

				if ( page ) {
					document.head.replaceChildren( ...page.head );
					render( page.body, rootFragment );
					window.history.pushState( {}, '', href );
				} else {
					window.location.assign( href );
				}
			}
		},
		prefetch( event, url ) {
			if ( ! canDoClientSideNavigation() ) return;
			const { ref } = getElement();
			const href = url ? url : ref.href;

			const newUrl = cleanUrl( href );
			if ( ! pages.has( newUrl ) ) {
				pages.set( newUrl, fetchPage( newUrl ) );
			}
		},
	},
} );

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
window.addEventListener( 'popstate', async () => {
	const url = cleanUrl( window.location ); // Remove hash.
	const page = pages.has( url ) && ( await pages.get( url ) );
	if ( page ) {
		document.head.replaceChildren( ...page.head );
		render( page.body, rootFragment );
	} else {
		window.location.reload();
	}
} );

// Initialize the router with the initial DOM.

if ( canDoClientSideNavigation() ) {
	rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);
	// Cache the scripts. Has to be called before fetching the assets.
	// const body = toVdom( document.body );
	// [].map.call( document.querySelectorAll( 'script[src]' ), ( script ) => {
	// 	scripts.set( script.getAttribute( 'src' ), script.textContent );
	// } );
	// const head = await fetchAssets( document );
	// pages.set( cleanUrl( window.location ), Promise.resolve( { body, head } ) );
}
