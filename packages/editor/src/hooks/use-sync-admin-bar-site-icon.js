import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

const SITE_NAME_SELECTOR = '#wp-admin-bar-site-name';
const SITE_ICON_SELECTOR = ':scope > img.site-icon';
const HAS_SITE_ICON_CLASS = 'has-site-icon';
const SITE_ICON_SIZE = 20;
const ADMIN_BAR_ICON_SIZE = 'site_icon-32x32';

/**
 * Shows an icon in the admin bar, adding or removing the markup that
 * `gutenberg_admin_bar_site_icon()` would have rendered.
 *
 * @param {string} url The icon to show, or an empty string to remove it.
 */
function updateAdminBarIcon( url ) {
	const siteName = document.querySelector( SITE_NAME_SELECTOR );

	if ( ! siteName ) {
		return;
	}

	const link = siteName.querySelector( ':scope > .ab-item' );

	if ( ! link ) {
		return;
	}

	let image = link.querySelector( SITE_ICON_SELECTOR );

	if ( ! url ) {
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

	image.removeAttribute( 'srcset' );
	image.src = url;
	siteName.classList.add( HAS_SITE_ICON_CLASS );
}

/**
 * Keeps the site icon in the admin bar in sync with the Site Icon.
 *
 * The admin bar is rendered by PHP before the editor mounts, so its icon would
 * otherwise keep showing the previous icon until the page is reloaded. The
 * markup mirrored here is built by `gutenberg_admin_bar_site_icon()` in
 * lib/compat/wordpress-7.1/admin-bar.php.
 */
export default function useSyncAdminBarSiteIcon() {
	const { canEditSite, savedIconId, iconUrl } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );
		const _canEditSite = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} );

		if ( ! _canEditSite ) {
			return { canEditSite: _canEditSite };
		}

		return {
			canEditSite: true,
			savedIconId: getEntityRecord( 'root', 'site' )?.site_icon,
			iconUrl: getEntityRecord( 'root', '__unstableBase' )?.site_icon_url,
		};
	}, [] );
	const { invalidateResolution } = useDispatch( coreStore );

	const previewIconUrl = useSelect( ( select ) => {
		const { getEntityRecordEdits, getEntityRecord } = select( coreStore );
		const edits = getEntityRecordEdits( 'root', 'site' );

		if ( ! edits || ! ( 'site_icon' in edits ) ) {
			return undefined;
		}

		if ( ! edits.site_icon ) {
			return '';
		}

		const attachment = getEntityRecord(
			'postType',
			'attachment',
			edits.site_icon,
			{ context: 'view' }
		);
		const sizes = attachment?.media_details?.sizes;

		return (
			sizes?.[ ADMIN_BAR_ICON_SIZE ]?.source_url ??
			sizes?.thumbnail?.source_url ??
			attachment?.source_url
		);
	}, [] );

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

	const renderedIconUrlRef = useRef();
	useEffect( () => {
		if ( ! canEditSite || iconUrl === undefined ) {
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
		updateAdminBarIcon( iconUrl );
	}, [ canEditSite, iconUrl ] );

	useEffect( () => {
		if (
			previewIconUrl === undefined ||
			renderedIconUrlRef.current === undefined ||
			renderedIconUrlRef.current === previewIconUrl
		) {
			return;
		}

		renderedIconUrlRef.current = previewIconUrl;
		updateAdminBarIcon( previewIconUrl );
	}, [ previewIconUrl ] );
}
