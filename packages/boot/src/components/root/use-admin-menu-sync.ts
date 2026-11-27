import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { findClosestMenuItem } from '../navigation/path-matching';
import { store as bootStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useLocation, useRouter } = unlock( routePrivateApis );

/**
 * Returns the route path an admin menu link opens, when the link points at
 * the current page (same admin file and `page` query arg).
 *
 * @param href       Link URL.
 * @param currentUrl URL of the current page.
 * @return The route path, or null when the link opens another page.
 */
export function getRoutePathFromHref(
	href: string,
	currentUrl: URL
): string | null {
	let url: URL;
	try {
		url = new URL( href, currentUrl );
	} catch {
		return null;
	}

	const page = url.searchParams.get( 'page' );
	if (
		url.origin !== currentUrl.origin ||
		url.pathname !== currentUrl.pathname ||
		! page ||
		page !== currentUrl.searchParams.get( 'page' )
	) {
		return null;
	}

	return url.searchParams.get( 'p' ) || '/';
}

function getPageLinks( menu: HTMLElement, currentUrl: URL ) {
	const links: { link: HTMLAnchorElement; to: string }[] = [];
	menu.querySelectorAll< HTMLAnchorElement >( 'a[href]' ).forEach(
		( link ) => {
			const to = getRoutePathFromHref( link.href, currentUrl );
			if ( to !== null ) {
				links.push( { link, to } );
			}
		}
	);
	return links;
}

/**
 * Lets the wp-admin menu navigate between the routes of the current page.
 *
 * Clicks on admin menu links that point at the current page are handled by
 * the router instead of reloading the page, and the `current` menu item is
 * updated when the route changes.
 *
 * When an entity is open in the editor, the highlight uses the route that
 * lists its post type. Edit routes like `/types/wp_template/edit/…` don't
 * start with the list route (`/templates`), so matching on the URL alone
 * would only highlight Editor.
 *
 * @param editedPostType Post type of the entity open in the editor, if any.
 */
export default function useAdminMenuSync( editedPostType?: string ) {
	const router = useRouter();
	const { pathname } = useLocation();
	const listPath = useSelect(
		( select ) =>
			editedPostType
				? select( bootStore ).getEntityLink( editedPostType )
				: undefined,
		[ editedPostType ]
	);
	const menuPath = listPath ?? pathname;

	useEffect( () => {
		const menu = document.getElementById( 'adminmenu' );
		if ( ! menu ) {
			return;
		}

		function onClick( event: MouseEvent ) {
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

			const link = ( event.target as Element | null )?.closest( 'a' );
			if ( ! link || ( link.target && link.target !== '_self' ) ) {
				return;
			}

			const to = getRoutePathFromHref(
				link.href,
				new URL( window.location.href )
			);
			if ( to === null ) {
				return;
			}

			event.preventDefault();
			router.navigate( { href: to } );
		}

		menu.addEventListener( 'click', onClick );
		return () => menu.removeEventListener( 'click', onClick );
	}, [ router ] );

	useEffect( () => {
		const menu = document.getElementById( 'adminmenu' );
		if ( ! menu ) {
			return;
		}

		const links = getPageLinks( menu, new URL( window.location.href ) );
		const match = findClosestMenuItem(
			menuPath,
			links.map( ( { to }, index ) => ( {
				id: String( index ),
				label: '',
				to,
			} ) )
		);
		const currentLink = match ? links[ Number( match.id ) ].link : null;

		links.forEach( ( { link } ) => {
			const isCurrent = link === currentLink;
			link.classList.toggle( 'current', isCurrent );
			link.parentElement?.classList.toggle( 'current', isCurrent );
			if ( isCurrent ) {
				link.setAttribute( 'aria-current', 'page' );
			} else {
				link.removeAttribute( 'aria-current' );
			}
		} );
	}, [ menuPath ] );
}
