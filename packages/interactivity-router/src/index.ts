/**
 * WordPress dependencies
 */
import { store, privateApis, getConfig } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { fetchHeadAssets, updateHead } from './head';

const {
	directivePrefix,
	getRegionRootFragment,
	initialVdom,
	toVdom,
	render,
	parseServerData,
	populateServerData,
	batch,
} = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

interface NavigateOptions {
	force?: boolean;
	html?: string;
	replace?: boolean;
	timeout?: number;
	loadingAnimation?: boolean;
	screenReaderAnnouncement?: boolean;
}

interface PrefetchOptions {
	force?: boolean;
	html?: string;
}

interface VdomParams {
	vdom?: typeof initialVdom;
}

interface Page {
	regions: Record< string, any >;
	head: HTMLHeadElement[];
	title: string;
	initialData: any;
}

type RegionsToVdom = ( dom: Document, params?: VdomParams ) => Promise< Page >;

// Check if the navigation mode is full page or region based.
const navigationMode: 'regionBased' | 'fullPage' =
	getConfig( 'core/router' ).navigationMode ?? 'regionBased';

// The cache of visited and prefetched pages, stylesheets and scripts.
const pages = new Map< string, Promise< Page | false > >();
const headElements = new Map< string, { tag: HTMLElement; text: string } >();

// Helper to remove domain and hash from the URL. We are only interesting in
// caching the path and the query.
const getPagePath = ( url: string ) => {
	const u = new URL( url, window.location.href );
	return u.pathname + u.search;
};

// Fetch a new page and convert it to a static virtual DOM.
const fetchPage = async ( url: string, { html }: { html: string } ) => {
	try {
		if ( ! html ) {
			const res = await window.fetch( url );
			if ( res.status !== 200 ) {
				return false;
			}
			html = await res.text();
		}
		const dom = new window.DOMParser().parseFromString( html, 'text/html' );
		return regionsToVdom( dom );
	} catch ( e ) {
		return false;
	}
};

// Return an object with VDOM trees of those HTML regions marked with a
// `router-region` directive.
const regionsToVdom: RegionsToVdom = async ( dom, { vdom } = {} ) => {
	const regions = { body: undefined };
	let head: HTMLElement[];
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		if ( navigationMode === 'fullPage' ) {
			head = await fetchHeadAssets( dom, headElements );
			regions.body = vdom
				? vdom.get( document.body )
				: toVdom( dom.body );
		}
	}
	if ( navigationMode === 'regionBased' ) {
		const attrName = `data-${ directivePrefix }-router-region`;
		dom.querySelectorAll( `[${ attrName }]` ).forEach( ( region ) => {
			const id = region.getAttribute( attrName );
			regions[ id ] = vdom?.has( region )
				? vdom.get( region )
				: toVdom( region );
		} );
	}
	const title = dom.querySelector( 'title' )?.innerText;
	const initialData = parseServerData( dom );
	return { regions, head, title, initialData };
};

// Render all interactive regions contained in the given page.
const renderRegions = ( page: Page ) => {
	batch( () => {
		if ( globalThis.IS_GUTENBERG_PLUGIN ) {
			if ( navigationMode === 'fullPage' ) {
				// Once this code is tested and more mature, the head should be updated for region based navigation as well.
				updateHead( page.head );
				const fragment = getRegionRootFragment( document.body );
				render( page.regions.body, fragment );
			}
		}
		if ( navigationMode === 'regionBased' ) {
			populateServerData( page.initialData );
			const attrName = `data-${ directivePrefix }-router-region`;
			document
				.querySelectorAll( `[${ attrName }]` )
				.forEach( ( region ) => {
					const id = region.getAttribute( attrName );
					const fragment = getRegionRootFragment( region );
					render( page.regions[ id ], fragment );
				} );
		}
		if ( page.title ) {
			document.title = page.title;
		}
	} );
};

/**
 * Load the given page forcing a full page reload.
 *
 * The function returns a promise that won't resolve, useful to prevent any
 * potential feedback indicating that the navigation has finished while the new
 * page is being loaded.
 *
 * @param href The page href.
 * @return Promise that never resolves.
 */
const forcePageReload = ( href: string ) => {
	window.location.assign( href );
	return new Promise( () => {} );
};

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
window.addEventListener( 'popstate', async () => {
	const pagePath = getPagePath( window.location.href ); // Remove hash.
	const page = pages.has( pagePath ) && ( await pages.get( pagePath ) );
	if ( page ) {
		renderRegions( page );
		// Update the URL in the state.
		state.url = window.location.href;
	} else {
		window.location.reload();
	}
} );

// Initialize the router and cache the initial page using the initial vDOM.
// Once this code is tested and more mature, the head should be updated for
// region based navigation as well.
if ( globalThis.IS_GUTENBERG_PLUGIN ) {
	if ( navigationMode === 'fullPage' ) {
		// Cache the scripts. Has to be called before fetching the assets.
		[].map.call( document.querySelectorAll( 'script[src]' ), ( script ) => {
			headElements.set( script.getAttribute( 'src' ), {
				tag: script,
				text: script.textContent,
			} );
		} );
		await fetchHeadAssets( document, headElements );
	}
}
pages.set(
	getPagePath( window.location.href ),
	Promise.resolve( regionsToVdom( document, { vdom: initialVdom } ) )
);

// Check if the link is valid for client-side navigation.
const isValidLink = ( ref: HTMLAnchorElement ) =>
	ref &&
	ref instanceof window.HTMLAnchorElement &&
	ref.href &&
	( ! ref.target || ref.target === '_self' ) &&
	ref.origin === window.location.origin &&
	! ref.pathname.startsWith( '/wp-admin' ) &&
	! ref.pathname.startsWith( '/wp-login.php' ) &&
	! ref.getAttribute( 'href' ).startsWith( '#' ) &&
	! new URL( ref.href ).searchParams.has( '_wpnonce' );

// Check if the event is valid for client-side navigation.
const isValidEvent = ( event: MouseEvent ) =>
	event &&
	event.button === 0 && // Left clicks only.
	! event.metaKey && // Open in new tab (Mac).
	! event.ctrlKey && // Open in new tab (Windows).
	! event.altKey && // Download.
	! event.shiftKey &&
	! event.defaultPrevented;

// Variable to store the current navigation.
let navigatingTo = '';

export const { state, actions } = store( 'core/router', {
	state: {
		url: window.location.href,
		navigation: {
			hasStarted: false,
			hasFinished: false,
			texts: {
				loading: '',
				loaded: '',
			},
			message: '',
		},
	},
	actions: {
		/**
		 * Navigates to the specified page.
		 *
		 * This function normalizes the passed href, fetchs the page HTML if
		 * needed, and updates any interactive regions whose contents have
		 * changed. It also creates a new entry in the browser session history.
		 *
		 * @param href                               The page href.
		 * @param [options]                          Options object.
		 * @param [options.force]                    If true, it forces re-fetching the URL.
		 * @param [options.html]                     HTML string to be used instead of fetching the requested URL.
		 * @param [options.replace]                  If true, it replaces the current entry in the browser session history.
		 * @param [options.timeout]                  Time until the navigation is aborted, in milliseconds. Default is 10000.
		 * @param [options.loadingAnimation]         Whether an animation should be shown while navigating. Default to `true`.
		 * @param [options.screenReaderAnnouncement] Whether a message for screen readers should be announced while navigating. Default to `true`.
		 *
		 * @return  Promise that resolves once the navigation is completed or aborted.
		 */
		*navigate( href: string, options: NavigateOptions = {} ) {
			const { clientNavigationDisabled } = getConfig();
			if ( clientNavigationDisabled ) {
				yield forcePageReload( href );
			}

			const pagePath = getPagePath( href );
			const { navigation } = state;
			const {
				loadingAnimation = true,
				screenReaderAnnouncement = true,
				timeout = 10000,
			} = options;

			navigatingTo = href;
			actions.prefetch( pagePath, options );

			// Create a promise that resolves when the specified timeout ends.
			// The timeout value is 10 seconds by default.
			const timeoutPromise = new Promise< void >( ( resolve ) =>
				setTimeout( resolve, timeout )
			);

			// Don't update the navigation status immediately, wait 400 ms.
			const loadingTimeout = setTimeout( () => {
				if ( navigatingTo !== href ) {
					return;
				}

				if ( loadingAnimation ) {
					navigation.hasStarted = true;
					navigation.hasFinished = false;
				}
				if ( screenReaderAnnouncement ) {
					navigation.message = navigation.texts.loading;
				}
			}, 400 );

			const page = yield Promise.race( [
				pages.get( pagePath ),
				timeoutPromise,
			] );

			// Dismiss loading message if it hasn't been added yet.
			clearTimeout( loadingTimeout );

			// Once the page is fetched, the destination URL could have changed
			// (e.g., by clicking another link in the meantime). If so, bail
			// out, and let the newer execution to update the HTML.
			if ( navigatingTo !== href ) {
				return;
			}

			if (
				page &&
				! page.initialData?.config?.[ 'core/router' ]
					?.clientNavigationDisabled
			) {
				yield renderRegions( page );
				window.history[
					options.replace ? 'replaceState' : 'pushState'
				]( {}, '', href );

				// Update the URL in the state.
				state.url = href;

				// Update the navigation status once the the new page rendering
				// has been completed.
				if ( loadingAnimation ) {
					navigation.hasStarted = false;
					navigation.hasFinished = true;
				}

				if ( screenReaderAnnouncement ) {
					// Announce that the page has been loaded. If the message is the
					// same, we use a no-break space similar to the @wordpress/a11y
					// package: https://github.com/WordPress/gutenberg/blob/c395242b8e6ee20f8b06c199e4fc2920d7018af1/packages/a11y/src/filter-message.js#L20-L26
					navigation.message =
						navigation.texts.loaded +
						( navigation.message === navigation.texts.loaded
							? '\u00A0'
							: '' );
				}

				// Scroll to the anchor if exits in the link.
				const { hash } = new URL( href, window.location.href );
				if ( hash ) {
					document.querySelector( hash )?.scrollIntoView();
				}
			} else {
				yield forcePageReload( href );
			}
		},

		/**
		 * Prefetchs the page with the passed URL.
		 *
		 * The function normalizes the URL and stores internally the fetch
		 * promise, to avoid triggering a second fetch for an ongoing request.
		 *
		 * @param url             The page URL.
		 * @param [options]       Options object.
		 * @param [options.force] Force fetching the URL again.
		 * @param [options.html]  HTML string to be used instead of fetching the requested URL.
		 */
		prefetch( url: string, options: PrefetchOptions = {} ) {
			const { clientNavigationDisabled } = getConfig();
			if ( clientNavigationDisabled ) {
				return;
			}

			const pagePath = getPagePath( url );
			if ( options.force || ! pages.has( pagePath ) ) {
				pages.set(
					pagePath,
					fetchPage( pagePath, { html: options.html } )
				);
			}
		},
	},
} );

// Add click and prefetch to all links.
if ( globalThis.IS_GUTENBERG_PLUGIN ) {
	if ( navigationMode === 'fullPage' ) {
		// Navigate on click.
		document.addEventListener(
			'click',
			function ( event ) {
				const ref = ( event.target as Element ).closest( 'a' );
				if ( isValidLink( ref ) && isValidEvent( event ) ) {
					event.preventDefault();
					actions.navigate( ref.href );
				}
			},
			true
		);
		// Prefetch on hover.
		document.addEventListener(
			'mouseenter',
			function ( event ) {
				if ( ( event.target as Element )?.nodeName === 'A' ) {
					const ref = ( event.target as Element ).closest( 'a' );
					if ( isValidLink( ref ) && isValidEvent( event ) ) {
						actions.prefetch( ref.href );
					}
				}
			},
			true
		);
	}
}
