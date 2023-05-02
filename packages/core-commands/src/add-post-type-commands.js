/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { useCommand } = unlock( privateApis );

export function useAddPostTypeCommands() {
	useCommand( {
		name: 'add new post',
		label: __( 'Add new post' ),
		icon: plus,
		callback: () => {
			document.location.href = 'post-new.php';
		},
	} );
	useCommand( {
		name: 'add new page',
		label: __( 'Add new page' ),
		icon: plus,
		callback: () => {
			document.location.href = 'post-new.php?post_type=page';
		},
	} );
}
