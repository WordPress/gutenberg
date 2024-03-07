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
const headElements = new Map();

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

const getTagId = ( tag ) => tag.id || tag.outerHTML;

const canBePreloaded = ( e ) => e.src || ( e.href && e.rel !== 'preload' );

const loadAsset = ( a ) => {
	const loader = document.createElement( 'link' );
	loader.rel = 'preload';
	if ( a.nodeName === 'SCRIPT' ) {
		loader.as = 'script';
		loader.href = a.getAttribute( 'src' );
	} else if ( a.nodeName === 'LINK' ) {
		loader.as = 'style';
		loader.href = a.getAttribute( 'href' );
	}

	const p = new Promise( ( resolve, reject ) => {
		loader.onload = () => resolve( loader );
		loader.onerror = () => reject( loader );
	} );

	document.head.appendChild( loader );
	return p;
};

const updateHead = async ( newHead ) => {
	// Map incoming head tags by their content.
	const newHeadMap = new Map();
	for ( const child of newHead ) {
		newHeadMap.set( getTagId( child ), child );
	}

	const toRemove = [];

	// Detect nodes that should be added or removed.
	for ( const child of document.head.children ) {
		const id = getTagId( child );
		// Always remove styles and links as they might change.
		if ( child.nodeName === 'LINK' || child.nodeName === 'STYLE' )
			toRemove.push( child );
		else if ( newHeadMap.has( id ) ) newHeadMap.delete( id );
		else if ( child.nodeName !== 'SCRIPT' && child.nodeName !== 'META' )
			toRemove.push( child );
	}

	// Prepare new assets.
	const toAppend = [ ...newHeadMap.values() ];

	// Wait for all new assets to be loaded.
	const loaders = await Promise.all(
		toAppend.filter( canBePreloaded ).map( loadAsset )
	);

	// Apply the changes.
	toRemove.forEach( ( n ) => n.remove() );
	loaders.forEach( ( l ) => l && l.remove() );
	document.head.append( ...toAppend );
};

const nextTick = ( fn ) =>
	new Promise( ( resolve ) => setTimeout( () => resolve( fn() ) ) );

// Fetch head assets of a new page.
const fetchAssets = async ( document ) => {
	const headTags = [];
	const assets = [
		{
			tagName: 'style',
			selector: 'link[rel=stylesheet]',
			attribute: 'href',
		},
		{ tagName: 'script', selector: 'script[src]', attribute: 'src' },
	];
	for ( const asset of assets ) {
		const { tagName, selector, attribute } = asset;
		const tags = document.querySelectorAll( selector );

		// Use Promise.all to wait for fetch to complete
		await Promise.all(
			Array.from( tags ).map( async ( tag ) => {
				const attributeValue = tag.getAttribute( attribute );
				if ( ! headElements.has( attributeValue ) ) {
					const response = await fetch( attributeValue );
					const text = await response.text();
					headElements.set( attributeValue, {
						tag,
						text,
					} );
				}

				const headElement = headElements.get( attributeValue );
				const element = document.createElement( tagName );
				element.innerText = headElement.text;
				for ( const attr of headElement.tag.attributes ) {
					element.setAttribute( attr.name, attr.value );
				}
				headTags.push( element );
			} )
		);
	}

	return [
		document.querySelector( 'title' ),
		...document.querySelectorAll( 'style' ),
		...headTags,
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
					yield updateHead( page.head );
					yield nextTick( () => render( page.body, rootFragment ) );
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
	[].map.call( document.querySelectorAll( 'script[src]' ), ( script ) => {
		headElements.set( script.getAttribute( 'src' ), {
			tag: script,
			text: script.textContent,
		} );
	} );
	const head = await fetchAssets( document );
	pages.set(
		cleanUrl( window.location ),
		Promise.resolve( { head, body: toVdom( document.body ) } )
	);
}
