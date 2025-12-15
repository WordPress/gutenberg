/**
 * WordPress dependencies
 */
import { store, privateApis, getConfig } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { preloadStyles, applyStyles, type StyleElement } from './assets/styles';
import {
	preloadScriptModules,
	importScriptModules,
	markScriptModuleAsResolved,
	type ScriptModuleLoad,
} from './assets/script-modules';

const {
	getRegionRootFragment,
	initialVdom,
	toVdom,
	render,
	parseServerData,
	populateServerData,
	batch,
	routerRegions,
	cloneElement,
	navigationSignal,
} = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

const regionAttr = `data-wp-router-region`;
const interactiveAttr = `data-wp-interactive`;
const regionsSelector = `[${ interactiveAttr }][${ regionAttr }], [${ interactiveAttr }] [${ interactiveAttr }][${ regionAttr }]`;

export interface NavigateOptions {
	force?: boolean;
	html?: string;
	replace?: boolean;
	timeout?: number;
	loadingAnimation?: boolean;
	screenReaderAnnouncement?: boolean;
}

export interface PrefetchOptions {
	force?: boolean;
	html?: string;
}

interface VdomParams {
	vdom?: typeof initialVdom;
}

interface Page {
	url: string;
	regions: Record< string, any >;
	regionsToAttach: Record< string, string >;
	styles: StyleElement[];
	scriptModules: ScriptModuleLoad[];
	title: string;
	initialData: any;
}

type PreparePage = (
	url: string,
	dom: Document,
	params?: VdomParams
) => Promise< Page >;

// The cache of visited and prefetched pages, stylesheets and scripts.
const pages = new Map< string, Promise< Page | false > >();

// Helper to remove domain and hash from the URL. We are only interesting in
// caching the path and the query.
const getPagePath = ( url: string ) => {
	const u = new URL( url, window.location.href );
	return u.pathname + u.search;
};

/**
 * Parses the given region's directive.
 *
 * @param region Region element.
 * @return Data contained in the region directive value.
 */
const parseRegionAttribute = ( region: Element ) => {
	const value = region.getAttribute( regionAttr );
	try {
		const { id, attachTo } = JSON.parse( value );
		return { id, attachTo };
	} catch ( e ) {
		return { id: value };
	}
};

/**
 * Clones the content of the router region vDOM passed as argument.
 *
 * The function creates a new VNode instance removing all priority levels up to
 * the one containing the router-region directive, which should have evaluated
 * in advance.
 *
 * @param vdom A router region's VNode.
 * @return The VNode for the passed router region's content.
 */
const cloneRouterRegionContent = ( vdom: any ) => {
	if ( ! vdom ) {
		return vdom;
	}
	const allPriorityLevels: string[][] = vdom.props.priorityLevels;
	const routerRegionLevel = allPriorityLevels.findIndex( ( level ) =>
		level.includes( 'router-region' )
	);
	const priorityLevels =
		routerRegionLevel !== -1
			? allPriorityLevels.slice( routerRegionLevel + 1 )
			: allPriorityLevels;

	return priorityLevels.length > 0
		? cloneElement( vdom, {
				...vdom.props,
				priorityLevels,
		  } )
		: vdom.props.element;
};

/**
 * IDs of router regions with an `attachTo` property pointing to the same parent
 * element.
 */
const regionsToAttachByParent = new WeakMap< Element, string[] >();

/**
 * Map of root fragments by parent element, used to render router regions with
 * the `attachTo` property. Those elements with the same parent are rendered
 * together in the corresponding root fragment.
 */
const rootFragmentsByParent = new WeakMap< Element, any >();

/**
 * Fetches and prepares a page from a given URL.
 *
 * @param url          The URL of the page to fetch.
 * @param options      Options for the fetch operation.
 * @param options.html Optional HTML content. If provided, the function will use
 *                     this instead of fetching from the URL.
 * @return             A Promise that resolves to the prepared page, or false if
 *                     there was an error during fetching or preparation.
 */
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
		return await preparePage( url, dom );
	} catch ( e ) {
		return false;
	}
};

/**
 * Processes a DOM document to extract router regions and related resources.
 *
 * This function analyzes the provided DOM document and creates a virtual DOM
 * representation of all HTML regions marked with a `router-region` directive.
 * It also extracts and preloads associated styles and scripts to prepare for
 * rendering the page.
 *
 * @param url             The URL associated with the page, used for asset
 *                        loading and caching.
 * @param dom             The DOM document to process.
 * @param vdomParams      Optional parameters for virtual DOM processing.
 * @param vdomParams.vdom An optional existing virtual DOM cache to check for
 *                        regions. If a region exists in this cache, it will be
 *                        reused instead of creating a new vDOM representation.
 * @return                A Promise that resolves to a {@link Page} object
 *                        containing the virtual DOM for all router regions,
 *                        preloaded styles and scripts, page title, and initial
 *                        server-rendered data.
 */
const preparePage: PreparePage = async ( url, dom, { vdom } = {} ) => {
	// Remove all noscript elements as they're irrelevant when request is served via router.
	// This prevents browsers from extracting styles from noscript tags.
	dom.querySelectorAll( 'noscript' ).forEach( ( el ) => el.remove() );

	const regions = {};
	const regionsToAttach = {};
	dom.querySelectorAll( regionsSelector ).forEach( ( region ) => {
		const { id, attachTo } = parseRegionAttribute( region );

		if ( region.parentElement.closest( `[${ regionAttr }]` ) ) {
			regions[ id ] = undefined;
		} else {
			regions[ id ] = vdom?.has( region )
				? vdom.get( region )
				: toVdom( region );
		}

		if ( attachTo ) {
			regionsToAttach[ id ] = attachTo;
		}
	} );

	const title = dom.querySelector( 'title' )?.innerText;
	const initialData = parseServerData( dom );

	// Wait for styles and modules to be ready.
	const [ styles, scriptModules ] = await Promise.all( [
		Promise.all( preloadStyles( dom, url ) ),
		Promise.all( preloadScriptModules( dom ) ),
	] );

	return {
		regions,
		regionsToAttach,
		styles,
		scriptModules,
		title,
		initialData,
		url,
	};
};

/**
 * Renders a page by applying styles, populating server data, rendering regions,
 * and updating the document title.
 *
 * @param page The {@link Page} object to render.
 */
const renderPage = ( page: Page ) => {
	applyStyles( page.styles );

	// Clone regionsToAttach.
	const regionsToAttach = { ...page.regionsToAttach };

	batch( () => {
		// Updates the server data.
		populateServerData( page.initialData );

		// Triggers navigation invalidations (`getServerState` and
		// `getServerContext`).
		navigationSignal.value += 1;

		// Resets all router regions before setting the actual values.
		( routerRegions as Map< string, any > ).forEach( ( signal ) => {
			signal.value = null;
		} );

		// Inits regions with attachTo that don't exist yet.
		const parentsToUpdate = new Set< Element >();
		for ( const id in regionsToAttach ) {
			const parent = document.querySelector( regionsToAttach[ id ] );
			if ( ! regionsToAttachByParent.has( parent ) ) {
				regionsToAttachByParent.set( parent, [] );
			}
			const regions = regionsToAttachByParent.get( parent );
			if ( ! regions.includes( id ) ) {
				regions.push( id );
				parentsToUpdate.add( parent );
			}
		}

		// Updates all existing regions.
		for ( const id in page.regions ) {
			if ( routerRegions.has( id ) ) {
				routerRegions.get( id ).value = cloneRouterRegionContent(
					page.regions[ id ]
				);
			}
		}

		// Renders regions attached to the same parent in the same fragment.
		parentsToUpdate.forEach( ( parent ) => {
			const ids = regionsToAttachByParent.get( parent );
			const vdoms = ids.map( ( id ) => page.regions[ id ] );

			if ( ! rootFragmentsByParent.has( parent ) ) {
				const regions = vdoms.map( ( { props, type } ) => {
					const elementType =
						typeof type === 'function' ? props.type : type;

					// Creates an element with the obtained type where the
					// region will be rendered. The type should match the one of
					// the root vnode.
					const region = document.createElement( elementType );
					parent.appendChild( region );
					return region;
				} );
				rootFragmentsByParent.set(
					parent,
					getRegionRootFragment( regions )
				);
			}
			const fragment = rootFragmentsByParent.get( parent );
			render( vdoms, fragment );
		} );
	} );

	if ( page.title ) {
		document.title = page.title;
	}
};

/**
 * Loads the given page forcing a full page reload.
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
		batch( () => {
			state.url = window.location.href;
			renderPage( page );
		} );
	} else {
		window.location.reload();
	}
} );

// Initialize the router and cache the initial page using the initial vDOM.
window.document
	.querySelectorAll< HTMLScriptElement >( 'script[type=module][src]' )
	.forEach( ( { src } ) => markScriptModuleAsResolved( src ) );
pages.set(
	getPagePath( window.location.href ),
	Promise.resolve(
		preparePage( getPagePath( window.location.href ), document, {
			vdom: initialVdom,
		} )
	)
);

// Variable to store the current navigation.
let navigatingTo = '';

let hasLoadedNavigationTextsData = false;
const navigationTexts = {
	loading: 'Loading page, please wait.',
	loaded: 'Page Loaded.',
};

interface Store {
	state: {
		url: string;
		navigation: {
			hasStarted: boolean;
			hasFinished: boolean;
		};
	};
	actions: {
		navigate: (
			href: string,
			options?: NavigateOptions
		) => Promise< void >;
		prefetch: ( url: string, options?: PrefetchOptions ) => Promise< void >;
	};
}

export const { state, actions } = store< Store >( 'core/router', {
	state: {
		url: window.location.href,
		navigation: {
			hasStarted: false,
			hasFinished: false,
		},
	},
	actions: {
		/**
		 * Navigates to the specified page.
		 *
		 * This function normalizes the passed href, fetches the page HTML if
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

			// Creates a promise that resolves when the specified timeout ends.
			// The timeout value is 10 seconds by default.
			const timeoutPromise = new Promise< void >( ( resolve ) =>
				setTimeout( resolve, timeout )
			);

			// Doesn't update the navigation status immediately, wait 400 ms.
			const loadingTimeout = setTimeout( () => {
				if ( navigatingTo !== href ) {
					return;
				}

				if ( loadingAnimation ) {
					navigation.hasStarted = true;
					navigation.hasFinished = false;
				}
				if ( screenReaderAnnouncement ) {
					a11ySpeak( 'loading' );
				}
			}, 400 );

			const page = yield Promise.race( [
				pages.get( pagePath ),
				timeoutPromise,
			] );

			// Dismisses loading message if it hasn't been added yet.
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
				yield importScriptModules( page.scriptModules );

				batch( () => {
					// Updates the URL in the state.
					state.url = href;

					// Updates the navigation status once the the new page rendering
					// has been completed.
					if ( loadingAnimation ) {
						navigation.hasStarted = false;
						navigation.hasFinished = true;
					}

					// Renders the new page.
					renderPage( page );
				} );

				window.history[
					options.replace ? 'replaceState' : 'pushState'
				]( {}, '', href );

				if ( screenReaderAnnouncement ) {
					a11ySpeak( 'loaded' );
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
		 * Prefetches the page with the passed URL.
		 *
		 * The function normalizes the URL and stores internally the fetch
		 * promise, to avoid triggering a second fetch for an ongoing request.
		 *
		 * @param url             The page URL.
		 * @param [options]       Options object.
		 * @param [options.force] Force fetching the URL again.
		 * @param [options.html]  HTML string to be used instead of fetching the requested URL.
		 *
		 * @return  Promise that resolves once the page has been fetched.
		 */
		*prefetch( url: string, options: PrefetchOptions = {} ) {
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

			yield pages.get( pagePath );
		},
	},
} );

/**
 * Announces a message to screen readers.
 *
 * This is a wrapper around the `@wordpress/a11y` package's `speak` function. It handles importing
 * the package on demand and should be used instead of calling `a11y.speak` directly.
 *
 * @param messageKey The message to be announced by assistive technologies.
 */
function a11ySpeak( messageKey: keyof typeof navigationTexts ) {
	if ( ! hasLoadedNavigationTextsData ) {
		hasLoadedNavigationTextsData = true;
		const content = document.getElementById(
			'wp-script-module-data-@wordpress/interactivity-router'
		)?.textContent;
		if ( content ) {
			try {
				const parsed = JSON.parse( content );
				if ( typeof parsed?.i18n?.loading === 'string' ) {
					navigationTexts.loading = parsed.i18n.loading;
				}
				if ( typeof parsed?.i18n?.loaded === 'string' ) {
					navigationTexts.loaded = parsed.i18n.loaded;
				}
			} catch {}
		} else {
			// Fallback to localized strings from Interactivity API state.
			// @todo This block is for Core < 6.7.0. Remove when support is dropped.

			// @ts-expect-error
			if ( state.navigation.texts?.loading ) {
				// @ts-expect-error
				navigationTexts.loading = state.navigation.texts.loading;
			}
			// @ts-expect-error
			if ( state.navigation.texts?.loaded ) {
				// @ts-expect-error
				navigationTexts.loaded = state.navigation.texts.loaded;
			}
		}
	}

	const message = navigationTexts[ messageKey ];

	import( '@wordpress/a11y' ).then(
		( { speak } ) => speak( message ),
		// Ignore failures to load the a11y module.
		() => {}
	);
}
