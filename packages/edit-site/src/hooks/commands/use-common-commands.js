/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, backup, help, styles, external } from '@wordpress/icons';
import { useCommandLoader, useCommand } from '@wordpress/commands';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

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

function useGlobalStylesOpenCssCommands() {
	const { openGeneralSidebar, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const history = useHistory();
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
		};
	}, [] );

	const commands = useMemo( () => {
		if ( ! canEditCSS ) {
			return [];
		}

		return [
			{
				name: 'core/edit-site/open-styles-css',
				label: __( 'Open CSS' ),
				icon: styles,
				callback: ( { close } ) => {
					close();
					history.push( {
						path: '/wp_global_styles',
						canvas: 'edit',
					} );
					openGeneralSidebar( 'edit-site/global-styles' );
					setEditorCanvasContainerView( 'global-styles-css' );
				},
			},
		];
	}, [
		history,
		openGeneralSidebar,
		setEditorCanvasContainerView,
		canEditCSS,
	] );
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
	const { createInfoNotice } = useDispatch( noticesStore );
	const history = useHistory();
	const { homeUrl, isDistractionFree } = useSelect( ( select ) => {
		const {
			getUnstableBase, // Site index.
		} = select( coreStore );

		return {
			homeUrl: getUnstableBase()?.home,
			isDistractionFree: select( preferencesStore ).get(
				editSiteStore.name,
				'distractionFree'
			),
		};
	}, [] );

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
			if ( isDistractionFree ) {
				set( editSiteStore.name, 'distractionFree', false );
				createInfoNotice( __( 'Distraction free mode turned off.' ), {
					type: 'snackbar',
				} );
			}
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

	useCommand( {
		name: 'core/edit-site/view-site',
		label: __( 'View site' ),
		callback: ( { close } ) => {
			close();
			window.open( homeUrl, '_blank' );
		},
		icon: external,
	} );

	useCommandLoader( {
		name: 'core/edit-site/reset-global-styles',
		hook: useGlobalStylesResetCommands,
	} );

	useCommandLoader( {
		name: 'core/edit-site/open-styles-css',
		hook: useGlobalStylesOpenCssCommands,
	} );
}
