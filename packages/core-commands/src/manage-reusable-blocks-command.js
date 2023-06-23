/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';

export function useManageReusableBlocksCommand() {
	useCommand( {
		name: 'core/manage-reusable-blocks',
		label: __( 'Manage all custom patterns' ),
		callback: () => {
			document.location.href = 'edit.php?post_type=wp_block';
		},
		icon: external,
	} );
}
