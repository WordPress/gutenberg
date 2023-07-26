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
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import getIsListPage from '../../utils/get-is-list-page';

const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

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
	const { openGeneralSidebar, setEditorCanvasContainerView, setCanvasMode } =
		unlock( useDispatch( editSiteStore ) );
	const { params } = useLocation();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isListPage = getIsListPage( params, isMobileViewport );
	const isEditorPage = ! isListPage;
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
	const { getCanvasMode } = unlock( useSelect( editSiteStore ) );

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
					if ( ! isEditorPage ) {
						history.push( {
							path: '/wp_global_styles',
							canvas: 'edit',
						} );
					}
					if ( isEditorPage && getCanvasMode() !== 'edit' ) {
						setCanvasMode( 'edit' );
					}
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
		isEditorPage,
		getCanvasMode,
		setCanvasMode,
	] );
	return {
		isLoading: false,
		commands,
	};
}

function useGlobalStylesOpenRevisionsCommands() {
	const { openGeneralSidebar, setEditorCanvasContainerView, setCanvasMode } =
		unlock( useDispatch( editSiteStore ) );
	const { getCanvasMode } = unlock( useSelect( editSiteStore ) );
	const { params } = useLocation();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isEditorPage = ! getIsListPage( params, isMobileViewport );
	const history = useHistory();
	const hasRevisions = useSelect(
		( select ) =>
			select( coreStore ).getCurrentThemeGlobalStylesRevisions()?.length,
		[]
	);
	const commands = useMemo( () => {
		if ( ! hasRevisions ) {
			return [];
		}

		return [
			{
				name: 'core/edit-site/open-global-styles-revisions',
				label: __( 'Open styles revisions' ),
				icon: backup,
				callback: ( { close } ) => {
					close();
					if ( ! isEditorPage ) {
						history.push( {
							path: '/wp_global_styles',
							canvas: 'edit',
						} );
					}
					if ( isEditorPage && getCanvasMode() !== 'edit' ) {
						setCanvasMode( 'edit' );
					}
					openGeneralSidebar( 'edit-site/global-styles' );
					setEditorCanvasContainerView( 'global-styles-revisions' );
				},
			},
		];
	}, [
		hasRevisions,
		history,
		openGeneralSidebar,
		setEditorCanvasContainerView,
		isEditorPage,
		getCanvasMode,
		setCanvasMode,
	] );

	return {
		isLoading: false,
		commands,
	};
}

export function useCommonCommands() {
	const { openGeneralSidebar, setCanvasMode } = unlock(
		useDispatch( editSiteStore )
	);
	const { params } = useLocation();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isEditorPage = ! getIsListPage( params, isMobileViewport );
	const { getCanvasMode } = unlock( useSelect( editSiteStore ) );
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
		name: 'core/edit-site/open-styles',
		label: __( 'Open styles' ),
		callback: ( { close } ) => {
			close();
			if ( ! isEditorPage ) {
				history.push( {
					path: '/wp_global_styles',
					canvas: 'edit',
				} );
			}
			if ( isEditorPage && getCanvasMode() !== 'edit' ) {
				setCanvasMode( 'edit' );
			}
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
			if ( ! isEditorPage ) {
				history.push( {
					path: '/wp_global_styles',
					canvas: 'edit',
				} );
			}
			if ( isEditorPage && getCanvasMode() !== 'edit' ) {
				setCanvasMode( 'edit' );
			}
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

	useCommandLoader( {
		name: 'core/edit-site/open-styles-revisions',
		hook: useGlobalStylesOpenRevisionsCommands,
	} );
}
