/**
 * WordPress dependencies
 */
import { useCommand } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus, symbol } from '@wordpress/icons';
import { addQueryArgs, getPath } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useIsTemplatesAccessible } from './hooks';
import { unlock } from './lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export function useAdminNavigationCommands() {
	const history = useHistory();
	const isTemplatesAccessible = useIsTemplatesAccessible();

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
		label: __( 'Patterns' ),
		icon: symbol,
		callback: ( { close } ) => {
			// The site editor and templates both check whether the user
			// can read templates. We can leverage that here and this
			// command links to the classic dashboard manage patterns page
			// if the user can't access it.
			if ( isTemplatesAccessible ) {
				const args = {
					path: '/patterns',
				};
				if ( isSiteEditor ) {
					history.push( args );
				} else {
					document.location = addQueryArgs( 'site-editor.php', args );
				}
				close();
			} else {
				document.location.href = 'edit.php?post_type=wp_block';
			}
		},
	} );
}
