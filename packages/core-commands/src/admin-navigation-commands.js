/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { external, plus } from '@wordpress/icons';

export function useAdminNavigationCommands() {
	useCommand( {
		name: 'core/add-new-post',
		label: __( 'Add new post' ),
		icon: plus,
		callback: () => {
			document.location.href = 'post-new.php';
		},
	} );
	useCommand( {
		name: 'core/add-new-page',
		label: __( 'Add new page' ),
		icon: plus,
		callback: () => {
			document.location.href = 'post-new.php?post_type=page';
		},
	} );
	useCommand( {
		name: 'core/manage-reusable-blocks',
		label: __( 'Manage all of my patterns' ),
		callback: () => {
			document.location.href = 'edit.php?post_type=wp_block';
		},
		icon: external,
	} );
}
