import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

const SITE_NAME_SELECTOR = '#wp-admin-bar-site-name';
const SITE_ICON_SELECTOR = ':scope > img.site-icon';
const SUPPORTS_SITE_ICON_CLASS = 'supports-site-icon';
const HAS_SITE_ICON_CLASS = 'has-site-icon';
const SITE_ICON_SIZE = 20;

/**
 * Keeps the site icon in the admin bar in sync with the saved Site Icon.
 *
 * The admin bar is rendered by PHP before the editor mounts, so its icon would
 * otherwise keep showing the previous icon until the page is reloaded. The
 * markup mirrored here is built by `gutenberg_admin_bar_site_icon()` in
 * lib/compat/wordpress-7.1/admin-bar.php, which also marks the node with
 * `supports-site-icon` to say whether an icon may be shown at all.
 */
export default function useSyncAdminBarSiteIcon() {
	const { savedIconId, iconUrl } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		return {
			// The persisted icon, which only changes once a save completes.
			savedIconId: getEntityRecord( 'root', 'site' )?.site_icon,
			// The icon's URL is derived server-side, so it lives on the base
			// entity rather than alongside the ID in the site settings.
			iconUrl: getEntityRecord( 'root', '__unstableBase' )?.site_icon_url,
		};
	}, [] );
	const { invalidateResolution } = useDispatch( coreStore );

	// Saving the icon leaves `site_icon_url` stale, because it is derived from
	// `site_icon` but belongs to a different entity that nothing refetches.
	const savedIconIdRef = useRef();
	useEffect( () => {
		const previousIconId = savedIconIdRef.current;
		savedIconIdRef.current = savedIconId;

		if (
			previousIconId === undefined ||
			savedIconId === undefined ||
			previousIconId === savedIconId
		) {
			return;
		}

		invalidateResolution( 'getEntityRecord', [ 'root', '__unstableBase' ] );
	}, [ savedIconId, invalidateResolution ] );

	// Tracks the icon the admin bar is showing. Seeded on the first resolution,
	// where the server-rendered icon is already correct, so that a page load
	// never rewrites the markup it just received.
	const renderedIconUrlRef = useRef();
	useEffect( () => {
		if ( iconUrl === undefined ) {
			return;
		}

		if ( renderedIconUrlRef.current === undefined ) {
			renderedIconUrlRef.current = iconUrl;
			return;
		}

		if ( renderedIconUrlRef.current === iconUrl ) {
			return;
		}

		renderedIconUrlRef.current = iconUrl;

		const siteName = document.querySelector( SITE_NAME_SELECTOR );

		// The class is absent when the `wp_admin_bar_show_site_icons` filter
		// turns icons off, which is not otherwise distinguishable from an
		// unset icon.
		if ( ! siteName?.classList.contains( SUPPORTS_SITE_ICON_CLASS ) ) {
			return;
		}

		const link = siteName.querySelector( ':scope > .ab-item' );

		if ( ! link ) {
			return;
		}

		let image = link.querySelector( SITE_ICON_SELECTOR );

		if ( ! iconUrl ) {
			image?.remove();
			siteName.classList.remove( HAS_SITE_ICON_CLASS );
			return;
		}

		if ( ! image ) {
			image = document.createElement( 'img' );
			image.className = 'site-icon';
			image.alt = '';
			image.width = SITE_ICON_SIZE;
			image.height = SITE_ICON_SIZE;
			link.prepend( image );
		}

		// `site_icon_url` is the full-size icon, so the 2x `srcset` rendered
		// alongside the initial markup is both unnecessary and stale — leaving
		// it would keep showing the previous icon on high-density screens.
		image.removeAttribute( 'srcset' );
		image.src = iconUrl;
		siteName.classList.add( HAS_SITE_ICON_CLASS );
	}, [ iconUrl ] );
}
