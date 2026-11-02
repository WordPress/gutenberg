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
 */

import { speak } from '@wordpress/a11y';
import { mountGuestPage, runInitModules } from '../app';
import { getPageKey } from '../app/router';
import type { Route } from '../../store/types';

export interface AdminShellPage {
	/** Page key, the `page` query argument (or file name for Core pages). */
	pageKey: string;
	/** Admin URL of the page, as linked from the admin menu. */
	url: string;
	/** ID of the element the page's app mounts into. */
	mountId: string;
	/** Page title, as shown in the admin menu and document title. */
	title: string;
	/** The page's `$hook_suffix`, which wp-admin adds as a body class. */
	bodyClass: string;
	/** The page's routes. */
	routes: Route[];
	/** Init modules the page runs before its app renders. */
	initModules?: string[];
}

interface PageState {
	/** Element shown and hidden when switching to and from the page. */
	element: HTMLElement;
	/** Element the app is mounted into. */
	mountElement: HTMLElement;
	isMounted: boolean;
	/** URL to restore when switching back to the page. */
	lastUrl?: string;
	documentTitle?: string;
}

const SNAPSHOT_KEY_PREFIX = 'wp-boot-admin-shell-header:';
const PLACEHOLDER_TIMEOUT = 5000;

let isStarted = false;

function readSnapshot( pageKey: string ) {
	try {
		return window.localStorage.getItem( SNAPSHOT_KEY_PREFIX + pageKey );
	} catch {
		return null;
	}
}

function writeSnapshot( pageKey: string, html: string ) {
	try {
		window.localStorage.setItem( SNAPSHOT_KEY_PREFIX + pageKey, html );
	} catch {
		// Storage can be full or unavailable; the placeholder is optional.
	}
}

function findHeading( element: HTMLElement ) {
	return element.querySelector< HTMLElement >(
		'[role="region"] h1, [role="region"] h2'
	);
}

/**
 * Serializes an app's layout down to and including its page header, so it
 * can be shown as a placeholder the next time the page is opened, before its
 * app has rendered. Everything after the header (the page body) is dropped.
 *
 * @param element App mount element.
 * @return HTML, or undefined when the app has no page header yet.
 */
function captureHeader( element: HTMLElement ) {
	const heading = findHeading( element );
	if ( ! heading ) {
		return undefined;
	}

	const clone = element.cloneNode( true ) as HTMLElement;
	const clonedHeading = findHeading( clone );
	if ( ! clonedHeading ) {
		return undefined;
	}

	// Find the header block: the child of the page region holding the heading.
	const region = clonedHeading.closest( '[role="region"]' );
	let node: Element = clonedHeading;
	while ( node.parentElement && node.parentElement !== region ) {
		node = node.parentElement;
	}

	// Drop everything after the header, at every level up to the root.
	while ( node && node !== clone ) {
		while ( node.nextSibling ) {
			node.nextSibling.remove();
		}
		node = node.parentElement as Element;
	}

	clone
		.querySelectorAll( '[id]' )
		.forEach( ( el ) => el.removeAttribute( 'id' ) );
	return clone.innerHTML;
}

/**
 * Builds a placeholder for a page that has never been opened in this browser
 * by borrowing another page's header and swapping in the title.
 *
 * @param source Mount element of a page that has rendered.
 * @param title  Title of the page being opened.
 */
function borrowHeader( source: HTMLElement, title: string ) {
	const html = captureHeader( source );
	if ( ! html ) {
		return undefined;
	}
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const heading = template.content.querySelector( 'h1, h2' );
	if ( heading ) {
		heading.textContent = title;
	}
	// The other page's actions and section navigation don't belong here.
	template.content
		.querySelectorAll( 'nav, button, a' )
		.forEach( ( el ) => el.remove() );
	return template.innerHTML;
}

function isSameAdminPage( href: string, page: AdminShellPage ) {
	const url = new URL( href, window.location.href );
	const pageUrl = new URL( page.url, window.location.href );
	return (
		url.origin === pageUrl.origin &&
		url.pathname === pageUrl.pathname &&
		getPageKey( url.href ) === page.pageKey
	);
}

/**
 * Moves the admin menu's "current" state to the menu item of `page`.
 *
 * @param page Page that is now visible.
 */
function highlightMenuItem( page: AdminShellPage ) {
	const menu = document.getElementById( 'adminmenu' );
	if ( ! menu ) {
		return;
	}
	// A top-level page is linked twice, by its menu item and by the first
	// item of its submenu. The submenu link is the one marked current.
	const links = Array.from(
		menu.querySelectorAll< HTMLAnchorElement >( 'a[href]' )
	).filter( ( a ) => isSameAdminPage( a.href, page ) );
	const link =
		links.find( ( a ) => a.closest( '.wp-submenu' ) ) ?? links[ 0 ];
	if ( ! link ) {
		return;
	}
	const topItem = link.closest< HTMLElement >( 'li.menu-top' );

	menu.querySelectorAll( '.wp-submenu .current' ).forEach( ( el ) =>
		el.classList.remove( 'current' )
	);
	menu.querySelectorAll( '[aria-current="page"]' ).forEach( ( el ) =>
		el.removeAttribute( 'aria-current' )
	);

	menu.querySelectorAll< HTMLElement >( 'li.menu-top' ).forEach( ( item ) => {
		const isCurrent = item === topItem;
		const topLink = item.querySelector( ':scope > a' );
		for ( const el of [ item, topLink ] ) {
			if ( ! el || ! el.classList.contains( 'wp-has-submenu' ) ) {
				continue;
			}
			el.classList.toggle( 'wp-has-current-submenu', isCurrent );
			el.classList.toggle( 'wp-menu-open', isCurrent );
			el.classList.toggle( 'wp-not-current-submenu', ! isCurrent );
		}
		if ( ! item.classList.contains( 'wp-has-submenu' ) ) {
			item.classList.toggle( 'current', isCurrent );
			topLink?.classList.toggle( 'current', isCurrent );
		}
	} );

	const item = link.closest( 'li' );
	if ( item && item !== topItem ) {
		item.classList.add( 'current' );
		link.classList.add( 'current' );
	}
	link.setAttribute( 'aria-current', 'page' );
}

function scheduleIdle( callback: () => void ) {
	if ( 'requestIdleCallback' in window ) {
		window.requestIdleCallback( callback, { timeout: 2000 } );
	} else {
		setTimeout( callback, 200 );
	}
}

interface StartAdminShellProps {
	pages: AdminShellPage[];
}

/**
 * Starts the admin shell. Call once on a page that belongs to `pages`.
 *
 * @param props       Shell options.
 * @param props.pages Pages that can be switched between in place.
 */
export function startAdminShell( { pages }: StartAdminShellProps ) {
	if ( isStarted ) {
		return;
	}

	const pagesByKey = new Map(
		pages.map( ( page ) => [ page.pageKey, page ] )
	);
	let activePage = pagesByKey.get( getPageKey() );
	const initialElement = activePage
		? document.getElementById( activePage.mountId )
		: null;
	if ( ! activePage || ! initialElement ) {
		return;
	}
	isStarted = true;

	const states = new Map< string, PageState >();
	states.set( activePage.pageKey, {
		element: initialElement,
		mountElement: initialElement,
		isMounted: true,
	} );

	// The loaded page has already run its init modules and loads its own
	// route modules.
	const warmups = new Map< string, Promise< void > >( [
		[ activePage.pageKey, Promise.resolve() ],
	] );

	/**
	 * Gets a page ready to mount without mounting it: runs its init modules
	 * and loads its route and content modules.
	 *
	 * @param page Page to prepare.
	 */
	function warm( page: AdminShellPage ) {
		let warmup = warmups.get( page.pageKey );
		if ( ! warmup ) {
			warmup = ( async () => {
				await runInitModules( page.initModules );
				const moduleIds = page.routes.flatMap( ( route ) =>
					[ route.route_module, route.content_module ].filter(
						( id ): id is string => !! id
					)
				);
				await Promise.all( moduleIds.map( ( id ) => import( id ) ) );
			} )();
			warmups.set( page.pageKey, warmup );
		}
		return warmup;
	}

	function rememberHeader( page: AdminShellPage ) {
		const state = states.get( page.pageKey );
		const html = state?.isMounted
			? captureHeader( state.mountElement )
			: undefined;
		if ( html ) {
			writeSnapshot( page.pageKey, html );
		}
	}

	function createPageElements( page: AdminShellPage ): PageState {
		const element = document.createElement( 'div' );
		element.className = 'boot-admin-shell-page';

		const mountElement = document.createElement( 'div' );
		mountElement.id = page.mountId;
		mountElement.className = 'boot-layout-container';

		const placeholderHtml =
			readSnapshot( page.pageKey ) ??
			borrowHeader(
				states.get( activePage!.pageKey )!.mountElement,
				page.title
			);
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
		initialElement!.after( element );
		return { element, mountElement, isMounted: false };
	}

	function setVisible( state: PageState, isVisible: boolean ) {
		// Inline display wins over wp-admin's rule that hides everything in
		// #wpbody-content except the loaded page's mount element.
		state.element.style.display = isVisible ? 'block' : 'none';
		state.element.inert = ! isVisible;
	}

	function showPage( page: AdminShellPage ) {
		const fromPage = activePage!;
		const fromState = states.get( fromPage.pageKey )!;
		fromState.documentTitle = document.title;
		rememberHeader( fromPage );

		let state = states.get( page.pageKey );
		if ( ! state ) {
			state = createPageElements( page );
			states.set( page.pageKey, state );
		}

		setVisible( fromState, false );
		setVisible( state, true );
		activePage = page;

		if ( ! state.isMounted ) {
			state.isMounted = true;
			const { mountElement } = state;
			warm( page )
				.then( () =>
					mountGuestPage( {
						element: mountElement,
						pageKey: page.pageKey,
						routes: page.routes,
					} )
				)
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
			state.documentTitle ??
			document.title.replace( /^.*?(?= ‹ )/, page.title );
		highlightMenuItem( page );
		window.scrollTo( 0, 0 );
		speak( page.title, 'assertive' );
	}

	function navigateTo( page: AdminShellPage, href: string ) {
		const fromState = states.get( activePage!.pageKey )!;
		fromState.lastUrl = window.location.href;

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
			( isMenuLink && states.get( page.pageKey )?.lastUrl ) || link.href
		);
	} );

	// Back and Forward between pages. Each app's router reads its own URL.
	window.addEventListener( 'popstate', () => {
		const page = pagesByKey.get( getPageKey() );
		if ( page && page !== activePage ) {
			showPage( page );
		}
	} );

	// Prepare a page as soon as a link to it is pointed at or focused.
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

	// Prepare the other pages while the browser is idle, one at a time.
	const queue = pages.filter( ( page ) => ! warmups.has( page.pageKey ) );
	const warmNext = () => {
		const page = queue.shift();
		if ( page ) {
			warm( page )
				.catch( () => {} )
				.finally( () => scheduleIdle( warmNext ) );
		}
	};
	scheduleIdle( warmNext );

	// Save this page's header for the next time it is opened from elsewhere.
	window.addEventListener( 'pagehide', () => rememberHeader( activePage! ) );
	scheduleIdle( () => rememberHeader( activePage! ) );
}
