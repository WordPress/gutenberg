/**
 * Admin shell (proof of concept).
 *
 * Makes switching between admin pages built with `@wordpress/build` (for
 * example Appearance > Fonts and Settings > Connectors, or a plugin's pages)
 * happen inside the current document instead of loading a new one. Each page
 * keeps its own app: the page that loaded boots as usual, and other pages are
 * booted into the same document the first time a link to them is clicked.
 * Switching back shows the existing app again, exactly as it was left.
 *
 * The server decides which pages take part and passes them to
 * `startAdminShell()`.
 *
 * URLs don't change: every page keeps its own `?page=` URL, so reloads,
 * bookmarks, Back/Forward and opening a link in a new tab behave as before.
 * Routers stay out of each other's way because each app's history only reacts
 * to URLs of its own page (see `createPathHistory`).
 *
 * To keep memory in check, at most `maxAlivePages` apps stay mounted; the
 * page shown least recently is unmounted first, and boots again, at the URL
 * it was left on, when it is opened next.
 */

import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { mountGuestPage, runInitModules, unmountPage } from '../app';
import { getPageKey } from '../app/page-key';
import { notifyPageVisibilityChange } from '../app/page-visibility';
import { highlightMenuItem, isSameAdminPage } from './admin-menu';
import {
	borrowHeader,
	captureHeader,
	findHeading,
	readSnapshot,
	writeSnapshot,
} from './header-snapshot';
import { showOverlaysOf, trackOverlays } from './overlays';
import { addRecentPage, getRecentPages } from './recent-pages';
import type { AdminShellPage, AdminShellPageChangeDetail } from './types';

export type { AdminShellPage, AdminShellPageChangeDetail } from './types';

/**
 * Event dispatched on `document` after the shell shows another page, with an
 * `AdminShellPageChangeDetail`. Use it for work that runs once per page view,
 * such as analytics, outside React. Inside a page's app, use
 * `usePageVisibility`.
 */
export const PAGE_CHANGE_EVENT = 'wp-admin-shell-page-change';

const DEFAULT_MAX_ALIVE_PAGES = 5;
const PLACEHOLDER_TIMEOUT = 5000;

interface MountedPage {
	/** Element shown and hidden when switching to and from the page. */
	element: HTMLElement;
	/** Element the app is mounted into. */
	mountElement: HTMLElement;
}

interface PageMemory {
	/** URL to restore when switching back to the page. */
	lastUrl?: string;
	documentTitle?: string;
}

let isStarted = false;
let getAlivePages: () => string[] = () => [];

/**
 * Returns the pages whose apps the admin shell keeps mounted, shown least
 * recently first. Empty when the shell isn't running.
 *
 * @return Page keys.
 */
export function getAlivePageKeys() {
	return getAlivePages();
}

function scheduleIdle( callback: () => void ) {
	if ( 'requestIdleCallback' in window ) {
		window.requestIdleCallback( callback, { timeout: 2000 } );
	} else {
		setTimeout( callback, 200 );
	}
}

/**
 * Asks the browser to fetch and compile a script module without running it.
 *
 * @param moduleId Script module ID, resolved through the import map.
 */
function preloadModule( moduleId: string ) {
	const { resolve } = import.meta as unknown as {
		resolve?: ( id: string ) => string;
	};
	let href: string;
	try {
		href = resolve ? resolve( moduleId ) : '';
	} catch {
		return;
	}
	if (
		! href ||
		document.querySelector(
			`link[rel="modulepreload"][href="${ CSS.escape( href ) }"]`
		)
	) {
		return;
	}
	const link = document.createElement( 'link' );
	link.rel = 'modulepreload';
	link.href = href;
	document.head.append( link );
}

function getModuleIds( page: AdminShellPage ) {
	return [
		...( page.initModules ?? [] ),
		...page.routes.flatMap( ( route ) =>
			[ route.route_module, route.content_module ].filter(
				( id ): id is string => !! id
			)
		),
	];
}

interface StartAdminShellProps {
	/** Pages that can be switched between in place. */
	pages: AdminShellPage[];
	/** How many pages' apps stay mounted at most, including the visible one. */
	maxAlivePages?: number;
}

/**
 * Starts the admin shell. Call once on a page that belongs to `pages`.
 *
 * @param props               Shell options.
 * @param props.pages         Pages that can be switched between in place.
 * @param props.maxAlivePages How many pages' apps stay mounted at most.
 */
export function startAdminShell( {
	pages,
	maxAlivePages = DEFAULT_MAX_ALIVE_PAGES,
}: StartAdminShellProps ) {
	if ( isStarted ) {
		return;
	}

	const pagesByKey = new Map(
		pages.map( ( page ) => [ page.pageKey, page ] )
	);
	const initialPage = pagesByKey.get( getPageKey() );
	const initialElement = initialPage
		? document.getElementById( initialPage.mountId )
		: null;
	if ( ! initialPage || ! initialElement ) {
		return;
	}
	isStarted = true;

	const maxAlive = Math.max( 1, Math.floor( maxAlivePages ) || 1 );
	let activePage: AdminShellPage = initialPage;

	const mounted = new Map< string, MountedPage >( [
		[
			initialPage.pageKey,
			{ element: initialElement, mountElement: initialElement },
		],
	] );
	// Mounted pages, shown least recently first.
	const recency: string[] = [ initialPage.pageKey ];
	getAlivePages = () => [ ...recency ];
	const memory = new Map< string, PageMemory >();
	const getMemory = ( pageKey: string ) => {
		let pageMemory = memory.get( pageKey );
		if ( ! pageMemory ) {
			pageMemory = {};
			memory.set( pageKey, pageMemory );
		}
		return pageMemory;
	};

	// The loaded page has already run its init modules and loads its own
	// route modules and data.
	const warmups = new Map< string, Promise< void > >( [
		[ initialPage.pageKey, Promise.resolve() ],
	] );

	/**
	 * Gets a page ready to mount without mounting it: runs its init modules,
	 * loads its route and content modules, and preloads its data.
	 *
	 * @param page Page to prepare.
	 */
	function warm( page: AdminShellPage ) {
		let warmup = warmups.get( page.pageKey );
		if ( ! warmup ) {
			warmup = Promise.all( [
				( async () => {
					await runInitModules( page.initModules );
					await Promise.all(
						page.routes
							.flatMap( ( route ) => [
								route.route_module,
								route.content_module,
							] )
							.filter( ( id ): id is string => !! id )
							.map( ( id ) => import( id ) )
					);
				} )(),
				preloadData( page ),
			] ).then( () => undefined );
			warmups.set( page.pageKey, warmup );
		}
		return warmup;
	}

	/**
	 * Fetches the REST responses the page preloads on its own page load, and
	 * hands them to `apiFetch`, so the page's first requests don't go to the
	 * network. A failure only means the page fetches its data itself.
	 *
	 * @param page Page to preload data for.
	 */
	async function preloadData( page: AdminShellPage ) {
		if ( ! page.preloadPath ) {
			return;
		}
		try {
			const data = await apiFetch< Record< string, unknown > >( {
				path: page.preloadPath,
			} );
			if ( data && typeof data === 'object' ) {
				apiFetch.use( apiFetch.createPreloadingMiddleware( data ) );
			}
		} catch {
			// The page loads its data itself.
		}
	}

	function rememberHeader( pageKey: string ) {
		const page = mounted.get( pageKey );
		const html = page ? captureHeader( page.mountElement ) : undefined;
		if ( html ) {
			writeSnapshot( pageKey, html );
		}
	}

	function createPageElements( page: AdminShellPage ): MountedPage {
		const element = document.createElement( 'div' );
		element.className = 'boot-admin-shell-page';

		const mountElement = document.createElement( 'div' );
		mountElement.id = page.mountId;
		mountElement.className = 'boot-layout-container';

		const visible = mounted.get( activePage.pageKey );
		const placeholderHtml =
			readSnapshot( page.pageKey ) ??
			( visible
				? borrowHeader( visible.mountElement, page.title )
				: undefined );
		if ( placeholderHtml ) {
			const placeholder = document.createElement( 'div' );
			placeholder.className = 'boot-layout-container';
			placeholder.inert = true;
			placeholder.innerHTML = placeholderHtml;
			element.append( placeholder );

			// Keep the app out of view until it renders its own header.
			mountElement.style.display = 'none';
			const reveal = () => {
				observer.disconnect();
				clearTimeout( timeout );
				placeholder.remove();
				mountElement.style.display = '';
			};
			const observer = new MutationObserver( () => {
				if ( findHeading( mountElement ) ) {
					reveal();
				}
			} );
			observer.observe( mountElement, {
				childList: true,
				subtree: true,
			} );
			const timeout = setTimeout( reveal, PLACEHOLDER_TIMEOUT );
		}

		element.append( mountElement );
		const anchor = visible?.element ?? initialElement!;
		if ( anchor.isConnected ) {
			anchor.after( element );
		} else {
			document.getElementById( 'wpbody-content' )?.append( element );
		}
		return { element, mountElement };
	}

	function setVisible( page: MountedPage, isVisible: boolean ) {
		// Inline display wins over wp-admin's rule that hides everything in
		// #wpbody-content except the loaded page's mount element.
		page.element.style.display = isVisible ? 'block' : 'none';
		page.element.inert = ! isVisible;
	}

	/**
	 * Unmounts the pages shown least recently until at most `maxAlive` stay.
	 * The visible page is never unmounted.
	 */
	function evictPages() {
		while ( recency.length > maxAlive ) {
			const pageKey = recency.shift()!;
			const page = mounted.get( pageKey );
			if ( ! page ) {
				continue;
			}
			rememberHeader( pageKey );
			unmountPage( page.mountElement );
			page.element.remove();
			mounted.delete( pageKey );
		}
	}

	function touch( pageKey: string ) {
		const index = recency.indexOf( pageKey );
		if ( index !== -1 ) {
			recency.splice( index, 1 );
		}
		recency.push( pageKey );
		addRecentPage( pageKey );
	}

	function showPage( page: AdminShellPage ) {
		const fromPage = activePage;
		const from = mounted.get( fromPage.pageKey );
		getMemory( fromPage.pageKey ).documentTitle = document.title;
		rememberHeader( fromPage.pageKey );

		let target = mounted.get( page.pageKey );
		const isNew = ! target;
		if ( ! target ) {
			target = createPageElements( page );
			mounted.set( page.pageKey, target );
		}

		if ( from ) {
			setVisible( from, false );
		}
		setVisible( target, true );
		activePage = page;

		if ( isNew ) {
			const { mountElement } = target;
			warm( page )
				.then( () => {
					// The page may have been unmounted while it was loading.
					if (
						mounted.get( page.pageKey )?.mountElement ===
						mountElement
					) {
						mountGuestPage( {
							element: mountElement,
							pageKey: page.pageKey,
							routes: page.routes,
						} );
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( error );
					// Fall back to a regular page load.
					window.location.assign( window.location.href );
				} );
		}

		document.body.classList.remove( fromPage.bodyClass );
		document.body.classList.add( page.bodyClass );
		document.title =
			getMemory( page.pageKey ).documentTitle ??
			document.title.replace( /^.*?(?= ‹ )/, page.title );
		highlightMenuItem( page );
		showOverlaysOf( page.pageKey );
		window.scrollTo( 0, 0 );
		speak( page.title, 'assertive' );

		touch( page.pageKey );
		evictPages();

		notifyPageVisibilityChange();
		document.dispatchEvent(
			new CustomEvent< AdminShellPageChangeDetail >( PAGE_CHANGE_EVENT, {
				detail: {
					pageKey: page.pageKey,
					previousPageKey: fromPage.pageKey,
					alivePageKeys: [ ...recency ],
				},
			} )
		);
	}

	function navigateTo( page: AdminShellPage, href: string ) {
		getMemory( activePage.pageKey ).lastUrl = window.location.href;

		const index = window.history.state?.__TSR_index ?? 0;
		const key = Math.random().toString( 36 ).slice( 2 );
		window.history.pushState(
			{ key, __TSR_key: key, __TSR_index: index + 1 },
			'',
			href
		);
		showPage( page );
	}

	document.addEventListener( 'click', ( event ) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		const link = ( event.target as Element | null )?.closest?.(
			'a[href]'
		) as HTMLAnchorElement | null;
		if ( ! link || ( link.target && link.target !== '_self' ) ) {
			return;
		}
		const page = pagesByKey.get( getPageKey( link.href ) );
		if ( ! page || ! isSameAdminPage( link.href, page ) ) {
			return;
		}
		const isMenuLink = !! link.closest( '#adminmenu' );

		if ( page === activePage ) {
			// Links within the page belong to its router. Like a reload, the
			// page's own menu item goes back to its start.
			if ( isMenuLink ) {
				event.preventDefault();
				if ( window.location.href !== link.href ) {
					window.history.pushState( null, '', link.href );
				}
			}
			return;
		}

		event.preventDefault();
		// The menu returns to where the page was left; other links, such as
		// a link from one page to a route of another, go where they point.
		navigateTo(
			page,
			( isMenuLink && getMemory( page.pageKey ).lastUrl ) || link.href
		);
	} );

	// Back and Forward between pages. Each app's router reads its own URL.
	window.addEventListener( 'popstate', () => {
		const page = pagesByKey.get( getPageKey() );
		if ( page && page !== activePage ) {
			showPage( page );
		}
	} );

	// Get a page fully ready as soon as a link to it is pointed at or focused.
	const warmFromEvent = ( event: Event ) => {
		const link = ( event.target as Element | null )?.closest?.(
			'a[href]'
		) as HTMLAnchorElement | null;
		const page = link && pagesByKey.get( getPageKey( link.href ) );
		if ( page && isSameAdminPage( link.href, page ) ) {
			warm( page ).catch( () => {} );
		}
	};
	document.addEventListener( 'pointerover', warmFromEvent );
	document.addEventListener( 'focusin', warmFromEvent );

	// While idle, fetch and compile, without running, the modules of the
	// pages this browser opened most recently.
	const prefetch = getRecentPages()
		.map( ( pageKey ) => pagesByKey.get( pageKey ) )
		.filter(
			( page ): page is AdminShellPage => !! page && page !== initialPage
		)
		.slice( 0, maxAlive );
	scheduleIdle( () =>
		prefetch.forEach( ( page ) =>
			getModuleIds( page ).forEach( preloadModule )
		)
	);

	trackOverlays( () => activePage.pageKey );
	addRecentPage( initialPage.pageKey );

	// Save this page's header for the next time it is opened from elsewhere.
	window.addEventListener( 'pagehide', () =>
		rememberHeader( activePage.pageKey )
	);
	scheduleIdle( () => rememberHeader( activePage.pageKey ) );
}
