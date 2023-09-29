/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

function buildNavigationLabel( title, id, status ) {
	if ( ! title ) {
		/* translators: %s is the index of the menu in the list of menus. */
		return sprintf( __( '(no title %s)' ), id );
	}

	if ( status === 'publish' ) {
		return decodeEntities( title );
	}

	return sprintf(
		// translators: %1s: title of the menu; %2s: status of the menu (draft, pending, etc.).
		__( '%1$s (%2$s)' ),
		decodeEntities( title ),
		status
	);
}

export default buildNavigationLabel;
