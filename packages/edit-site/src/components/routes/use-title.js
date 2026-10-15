import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

// The layout (screen names) and the editor (the edited entity) both call this
// hook, so the last announced screen is shared between them.
let lastScreen;

const ITEM_ROUTES = [
	'page-item',
	'post-item',
	'template-item',
	'static-template-item',
	'template-part-item',
	'pattern-item',
	'navigation-item',
];

/**
 * Whether the edited entity is the current screen: the canvas is in edit mode,
 * or the route shows a single item. Otherwise the canvas is only a preview.
 *
 * @param {string} routeName Name of the current route.
 * @param {string} canvas    Canvas mode, 'view' or 'edit'.
 * @return {boolean} Whether the editor names the screen.
 */
export function isEditorScreen( routeName, canvas ) {
	return canvas === 'edit' || ITEM_ROUTES.includes( routeName );
}

function getScreenTitle( routeName ) {
	switch ( routeName ) {
		case 'home':
			return __( 'Design' );
		case 'identity':
			return _x( 'Identity', 'site identity' );
		case 'styles':
		case 'stylebook':
			return __( 'Styles' );
		case 'navigation':
			return __( 'Navigation' );
		case 'pages':
			return __( 'Pages' );
		case 'patterns':
			return __( 'Patterns' );
		case 'templates':
			return __( 'Templates' );
	}
}

/**
 * Sets the document title to the current screen's name, and announces it,
 * while the canvas is only a preview. See `useTitle`.
 */
export function useScreenTitle() {
	const { name, query } = useLocation();
	useTitle(
		isEditorScreen( name, query?.canvas )
			? undefined
			: getScreenTitle( name )
	);
}

/**
 * Sets the document title and announces the screen to screen readers.
 *
 * The title is announced only when the screen changes: the path or the canvas
 * mode is different, and so is the title. It is not announced on first load,
 * when only the query changes (search, filters, selection), or when the title
 * changes while the screen stays the same (for example a rename).
 *
 * @param {string} title Title of the current screen. Nothing happens when empty.
 */
export default function useTitle( title ) {
	const { path, query } = useLocation();
	const screenKey = `${ path }|${ query?.canvas ?? 'view' }`;
	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', 'site' )?.title,
		[]
	);

	useEffect( () => {
		if ( ! title || ! siteTitle ) {
			return;
		}

		// @see https://github.com/WordPress/wordpress-develop/blob/94849898192d271d533e09756007e176feb80697/src/wp-admin/admin-header.php#L67-L68
		document.title = sprintf(
			/* translators: Admin document title. 1: Admin screen name, 2: Network or site name. */
			__( '%1$s ‹ %2$s ‹ Editor — WordPress' ),
			decodeEntities( title ),
			decodeEntities( siteTitle )
		);

		const previous = lastScreen;
		lastScreen = { key: screenKey, title };
		if (
			previous &&
			previous.key !== screenKey &&
			previous.title !== title
		) {
			speak( title, 'assertive' );
		}
	}, [ title, siteTitle, screenKey ] );
}
