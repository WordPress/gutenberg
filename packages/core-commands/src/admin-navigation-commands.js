/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { external, plus, symbol } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs, getPath } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export function useAdminNavigationCommands() {
	const history = useHistory();
	const getSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings
	);
	const settings = getSettings();
	const isBlockTheme = settings.__unstableIsBlockBasedTheme;
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
		label: __( 'Manage all of my patterns' ),
		callback: ( { close } ) => {
			// __unstableIsBlockBasedTheme is not defined in the site editor so we need to check the context.
			// If not the site editor and not a block based theme then redirect to the old wp-admin patterns page.
			if ( ! isSiteEditor && ! isBlockTheme ) {
				document.location.href = 'edit.php?post_type=wp_block';
			} else {
				const args = {
					path: '/patterns',
				};
				const targetUrl = addQueryArgs( 'site-editor.php', args );
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = targetUrl;
				}
				close();
			}
		},
		icon: isSiteEditor ? symbol : external,
	} );
}
