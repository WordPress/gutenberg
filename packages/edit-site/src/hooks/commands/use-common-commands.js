/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	rotateLeft,
	rotateRight,
	backup,
	help,
	styles,
	external,
	brush,
} from '@wordpress/icons';
import { useCommandLoader, useCommand } from '@wordpress/commands';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

const getGlobalStylesOpenStylesCommands = () =>
	function useGlobalStylesOpenStylesCommands() {
		const { openGeneralSidebar } = unlock( useDispatch( editSiteStore ) );
		const { params } = useLocation();
		const { canvas = 'view' } = params;
		const history = useHistory();
		const isBlockBasedTheme = useSelect( ( select ) => {
			return select( coreStore ).getCurrentTheme().is_block_theme;
		}, [] );

		const commands = useMemo( () => {
			if ( ! isBlockBasedTheme ) {
				return [];
			}

			return [
				{
					name: 'core/edit-site/open-styles',
					label: __( 'Open styles' ),
					callback: ( { close } ) => {
						close();
						if ( canvas !== 'edit' ) {
							history.navigate( '/styles?canvas=edit', {
								transition: 'canvas-mode-edit-transition',
							} );
						}
						openGeneralSidebar( 'edit-site/global-styles' );
					},
					icon: styles,
				},
			];
		}, [ history, openGeneralSidebar, canvas, isBlockBasedTheme ] );

		return {
			isLoading: false,
			commands,
		};
	};

const getGlobalStylesToggleWelcomeGuideCommands = () =>
	function useGlobalStylesToggleWelcomeGuideCommands() {
		const { openGeneralSidebar } = unlock( useDispatch( editSiteStore ) );
		const { params } = useLocation();
		const { canvas = 'view' } = params;
		const { set } = useDispatch( preferencesStore );

		const history = useHistory();
		const isBlockBasedTheme = useSelect( ( select ) => {
			return select( coreStore ).getCurrentTheme().is_block_theme;
		}, [] );

		const commands = useMemo( () => {
			if ( ! isBlockBasedTheme ) {
				return [];
			}

			return [
				{
					name: 'core/edit-site/toggle-styles-welcome-guide',
					label: __( 'Learn about styles' ),
					callback: ( { close } ) => {
						close();
						if ( canvas !== 'edit' ) {
							history.navigate( '/styles?canvas=edit', {
								transition: 'canvas-mode-edit-transition',
							} );
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
				},
			];
		}, [ history, openGeneralSidebar, canvas, isBlockBasedTheme, set ] );

		return {
			isLoading: false,
			commands,
		};
	};

const getGlobalStylesResetCommands = () =>
	function useGlobalStylesResetCommands() {
		const [ canReset, onReset ] = useGlobalStylesReset();
		const commands = useMemo( () => {
			if ( ! canReset ) {
				return [];
			}

			return [
				{
					name: 'core/edit-site/reset-global-styles',
					label: __( 'Reset styles' ),
					icon: isRTL() ? rotateRight : rotateLeft,
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
	};

const getGlobalStylesOpenCssCommands = () =>
	function useGlobalStylesOpenCssCommands() {
		const { openGeneralSidebar, setEditorCanvasContainerView } = unlock(
			useDispatch( editSiteStore )
		);
		const { params } = useLocation();
		const { canvas = 'view' } = params;
		const history = useHistory();
		const { canEditCSS } = useSelect( ( select ) => {
			const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
				select( coreStore );

			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const globalStyles = globalStylesId
				? getEntityRecord( 'root', 'globalStyles', globalStylesId )
				: undefined;

			return {
				canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
			};
		}, [] );

		const commands = useMemo( () => {
			if ( ! canEditCSS ) {
				return [];
			}

			return [
				{
					name: 'core/edit-site/open-styles-css',
					label: __( 'Customize CSS' ),
					icon: brush,
					callback: ( { close } ) => {
						close();
						if ( canvas !== 'edit' ) {
							history.navigate( '/styles?canvas=edit', {
								transition: 'canvas-mode-edit-transition',
							} );
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
			canvas,
		] );
		return {
			isLoading: false,
			commands,
		};
	};

const getGlobalStylesOpenRevisionsCommands = () =>
	function useGlobalStylesOpenRevisionsCommands() {
		const { openGeneralSidebar, setEditorCanvasContainerView } = unlock(
			useDispatch( editSiteStore )
		);
		const { params } = useLocation();
		const { canvas = 'view' } = params;
		const history = useHistory();
		const hasRevisions = useSelect( ( select ) => {
			const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
				select( coreStore );
			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const globalStyles = globalStylesId
				? getEntityRecord( 'root', 'globalStyles', globalStylesId )
				: undefined;
			return !! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count;
		}, [] );

		const commands = useMemo( () => {
			if ( ! hasRevisions ) {
				return [];
			}

			return [
				{
					name: 'core/edit-site/open-global-styles-revisions',
					label: __( 'Style revisions' ),
					icon: backup,
					callback: ( { close } ) => {
						close();
						if ( canvas !== 'edit' ) {
							history.navigate( '/styles?canvas=edit', {
								transition: 'canvas-mode-edit-transition',
							} );
						}
						openGeneralSidebar( 'edit-site/global-styles' );
						setEditorCanvasContainerView(
							'global-styles-revisions'
						);
					},
				},
			];
		}, [
			hasRevisions,
			history,
			openGeneralSidebar,
			setEditorCanvasContainerView,
			canvas,
		] );

		return {
			isLoading: false,
			commands,
		};
	};

export function useCommonCommands() {
	const homeUrl = useSelect( ( select ) => {
		// Site index.
		return select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
			?.home;
	}, [] );

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
		name: 'core/edit-site/open-styles',
		hook: getGlobalStylesOpenStylesCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/toggle-styles-welcome-guide',
		hook: getGlobalStylesToggleWelcomeGuideCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/reset-global-styles',
		hook: getGlobalStylesResetCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/open-styles-css',
		hook: getGlobalStylesOpenCssCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/open-styles-revisions',
		hook: getGlobalStylesOpenRevisionsCommands(),
	} );
}
