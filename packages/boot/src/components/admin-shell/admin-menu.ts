import { getPageKey } from '../app/page-key';
import type { AdminShellPage } from './types';

/**
 * Returns whether `href` points at `page`.
 *
 * @param href URL to check.
 * @param page Shell page.
 */
export function isSameAdminPage( href: string, page: AdminShellPage ) {
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
export function highlightMenuItem( page: AdminShellPage ) {
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
	// Reset hover flyouts, as a page load would. A flyout that is open while
	// its item becomes current would otherwise keep the offset that
	// `common.js` gives it to fit the viewport, and cover the items above.
	menu.querySelectorAll( 'li.opensub' ).forEach( ( el ) =>
		el.classList.remove( 'opensub' )
	);
	menu.querySelectorAll< HTMLElement >( '.wp-submenu' ).forEach( ( el ) =>
		el.style.removeProperty( 'margin-top' )
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
