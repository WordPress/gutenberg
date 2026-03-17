/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

// Copied from packages/block-library/src/navigation/edit/navigation-menu-selector.js.
export default function buildNavigationLabel( title, id, status ) {
	if ( ! title?.rendered ) {
		/* translators: %s: the index of the menu in the list of menus. */
		return sprintf( __( '(no title %s)' ), id );
	}

	if ( status === 'publish' ) {
		return decodeEntities( title?.rendered );
	}

	return sprintf(
		// translators: 1: title of the menu. 2: status of the menu (draft, pending, etc.).
		_x( '%1$s (%2$s)', 'menu label' ),
		decodeEntities( title?.rendered ),
		status
	);
}
