/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

export default function useTitle( title ) {
	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', 'site' )?.title,
		[]
	);

	useEffect( () => {
		if ( title && siteTitle ) {
			// @see https://github.com/WordPress/wordpress-develop/blob/94849898192d271d533e09756007e176feb80697/src/wp-admin/admin-header.php#L67-L68
			const formattedTitle = sprintf(
				/* translators: Admin screen title. 1: Admin screen name, 2: Network or site name. */
				__( '%1$s ‹ %2$s — WordPress' ),
				title,
				siteTitle
			);

			if ( document.title !== formattedTitle ) {
				document.title = formattedTitle;

				// TODO: We might want to also add accessibility-related announcements here.
			}
		}
	}, [ title, siteTitle ] );
}
