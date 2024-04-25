/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	drawerLeft,
	drawerRight,
	blockDefault,
	fullscreen,
	formatListBullets,
} from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

export default function useCommonCommands() {
	const { openGeneralSidebar, closeGeneralSidebar } =
		useDispatch( editPostStore );
	const { activeSidebar, isFullscreen, isPublishSidebarEnabled } = useSelect(
		( select ) => {
			const { get } = select( preferencesStore );

			return {
				activeSidebar:
					select( interfaceStore ).getActiveComplementaryArea(
						'core'
					),
				isPublishSidebarEnabled:
					select( editorStore ).isPublishSidebarEnabled(),
				isFullscreen: get( 'core/edit-post', 'fullscreenMode' ),
			};
		},
		[]
	);
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );

	useCommand( {
		name: 'core/open-settings-sidebar',
		label: __( 'Toggle settings sidebar' ),
		icon: isRTL() ? drawerLeft : drawerRight,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/document' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/document' );
			}
		},
	} );

	useCommand( {
		name: 'core/open-block-inspector',
		label: __( 'Toggle block inspector' ),
		icon: blockDefault,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/block' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/block' );
			}
		},
	} );

	useCommand( {
		name: 'core/toggle-fullscreen-mode',
		label: isFullscreen
			? __( 'Exit fullscreen' )
			: __( 'Enter fullscreen' ),
		icon: fullscreen,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fullscreenMode' );
			close();
			createInfoNotice(
				isFullscreen ? __( 'Fullscreen off.' ) : __( 'Fullscreen on.' ),
				{
					id: 'core/edit-post/toggle-fullscreen-mode/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								toggle( 'core/edit-post', 'fullscreenMode' );
							},
						},
					],
				}
			);
		},
	} );

	useCommand( {
		name: 'core/toggle-publish-sidebar',
		label: isPublishSidebarEnabled
			? __( 'Disable pre-publish checks' )
			: __( 'Enable pre-publish checks' ),
		icon: formatListBullets,
		callback: ( { close } ) => {
			close();
			toggle( 'core', 'isPublishSidebarEnabled' );
			createInfoNotice(
				isPublishSidebarEnabled
					? __( 'Pre-publish checks disabled.' )
					: __( 'Pre-publish checks enabled.' ),
				{
					id: 'core/editor/publish-sidebar/notice',
					type: 'snackbar',
				}
			);
		},
	} );
}
