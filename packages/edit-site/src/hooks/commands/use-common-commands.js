/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { rotateLeft, rotateRight, help, backup } from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { useGlobalStyles } = unlock( editorPrivateApis );

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
		const { user, setUser } = useGlobalStyles();

		// Check if there are user customizations that can be reset
		const canReset =
			!! user &&
			( Object.keys( user?.styles ?? {} ).length > 0 ||
				Object.keys( user?.settings ?? {} ).length > 0 );

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
						setUser( { styles: {}, settings: {} } );
					},
				},
			];
		}, [ canReset, setUser ] );

		return {
			isLoading: false,
			commands,
		};
	};

const getGlobalStylesOpenRevisionsCommands = () =>
	function useGlobalStylesOpenRevisionsCommands() {
		const { openGeneralSidebar } = unlock( useDispatch( editSiteStore ) );
		const { setStylesPath } = unlock( useDispatch( editorStore ) );
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
					name: 'core/edit-site/open-styles-revisions',
					label: __( 'Open style revisions' ),
					icon: backup,
					callback: ( { close } ) => {
						close();
						if ( canvas !== 'edit' ) {
							history.navigate( '/styles?canvas=edit', {
								transition: 'canvas-mode-edit-transition',
							} );
						}
						openGeneralSidebar( 'edit-site/global-styles' );
						setStylesPath( '/revisions' );
					},
				},
			];
		}, [
			history,
			openGeneralSidebar,
			setStylesPath,
			hasRevisions,
			canvas,
		] );

		return {
			isLoading: false,
			commands,
		};
	};

export function useCommonCommands() {
	useCommandLoader( {
		name: 'core/edit-site/toggle-styles-welcome-guide',
		hook: getGlobalStylesToggleWelcomeGuideCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/reset-global-styles',
		hook: getGlobalStylesResetCommands(),
	} );

	useCommandLoader( {
		name: 'core/edit-site/open-styles-revisions',
		hook: getGlobalStylesOpenRevisionsCommands(),
	} );
}
