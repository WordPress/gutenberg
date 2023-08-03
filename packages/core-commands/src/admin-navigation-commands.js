/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { external, plus, symbol } from '@wordpress/icons';
import { addQueryArgs, getPath } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useIsSiteEditorAccessible } from './hooks';
import { unlock } from './lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export function useAdminNavigationCommands() {
	const history = useHistory();
	const isSiteEditorAccessible = useIsSiteEditorAccessible();

	const isSiteEditor = getPath( window.location.href )?.includes(
		'site-editor.php'
	);

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
		label: __( 'Open patterns' ),
		callback: ( { close } ) => {
			if ( ! isSiteEditorAccessible ) {
				document.location.href = 'edit.php?post_type=wp_block';
			} else {
				const args = {
					path: '/patterns',
				};
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = addQueryArgs( 'site-editor.php', args );
				}
				close();
			}
		},
		icon: isSiteEditor ? symbol : external,
	} );
}
