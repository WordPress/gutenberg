/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, backup, help, styles } from '@wordpress/icons';
import { useCommandLoader, useCommand } from '@wordpress/commands';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

function useGlobalStylesResetCommands() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const commands = useMemo( () => {
		if ( ! canReset ) {
			return [];
		}

		return [
			{
				name: 'core/edit-site/reset-global-styles',
				label: __( 'Reset styles to defaults' ),
				icon: trash,
				callback: ( { close } ) => {
					close();
					onReset();
				},
			},
		];
	}, [ canReset, onReset ] );

	return {
		isLoading: false,
		commands,
	};
}

export function useCommonCommands() {
	const { openGeneralSidebar, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { set } = useDispatch( preferencesStore );
	const history = useHistory();

	useCommand( {
		name: 'core/edit-site/open-global-styles-revisions',
		label: __( 'Open styles revisions' ),
		icon: backup,
		callback: ( { close } ) => {
			close();
			history.push( {
				path: '/wp_global_styles',
				canvas: 'edit',
			} );
			openGeneralSidebar( 'edit-site/global-styles' );
			setEditorCanvasContainerView( 'global-styles-revisions' );
		},
	} );

	useCommand( {
		name: 'core/edit-site/open-styles',
		label: __( 'Open styles' ),
		callback: ( { close } ) => {
			close();
			history.push( {
				path: '/wp_global_styles',
				canvas: 'edit',
			} );
			openGeneralSidebar( 'edit-site/global-styles' );
		},
		icon: styles,
	} );

	useCommand( {
		name: 'core/edit-site/toggle-styles-welcome-guide',
		label: __( 'Learn about styles' ),
		callback: ( { close } ) => {
			close();
			history.push( {
				path: '/wp_global_styles',
				canvas: 'edit',
			} );
			openGeneralSidebar( 'edit-site/global-styles' );
			set( 'core/edit-site', 'welcomeGuideStyles', true );
			// sometimes there's a focus loss that happens after some time
			// that closes the modal, we need to force reopening it.
			setTimeout( () => {
				set( 'core/edit-site', 'welcomeGuideStyles', true );
			}, 500 );
		},
		icon: help,
	} );

	useCommandLoader( {
		name: 'core/edit-site/reset-global-styles',
		hook: useGlobalStylesResetCommands,
	} );
}
