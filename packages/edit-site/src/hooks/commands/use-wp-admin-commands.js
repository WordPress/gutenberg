/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

export function useWPAdminCommands() {
	const newPostLink = useSelect( ( select ) => {
		select( editSiteStore ).getEditedPostType();
		const { getSettings } = unlock( select( editSiteStore ) );
		return getSettings().newPostLink ?? 'post-new.php';
	}, [] );

	useCommand( {
		name: 'core/wp-admin/create-post',
		label: __( 'Create a new post' ),
		callback: () => {
			document.location.href = newPostLink;
		},
	} );

	useCommand( {
		name: 'core/wp-admin/create-page',
		label: __( 'Create a new page' ),
		callback: () => {
			document.location.href = newPostLink + '?post_type=page';
		},
	} );
}
