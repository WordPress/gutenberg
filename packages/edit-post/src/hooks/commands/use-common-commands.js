/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	code,
	drawerLeft,
	drawerRight,
	blockDefault,
	keyboard,
	desktop,
	listView,
	external,
	formatListBullets,
} from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { KEYBOARD_SHORTCUT_HELP_MODAL_NAME } from '../../components/keyboard-shortcut-help-modal';
import { PREFERENCES_MODAL_NAME } from '../../components/preferences-modal';
import { store as editPostStore } from '../../store';

export default function useCommonCommands() {
	const {
		openGeneralSidebar,
		closeGeneralSidebar,
		switchEditorMode,
		setIsListViewOpened,
		toggleDistractionFree,
	} = useDispatch( editPostStore );
	const { openModal } = useDispatch( interfaceStore );
	const {
		editorMode,
		activeSidebar,
		isListViewOpen,
		isPublishSidebarEnabled,
		showBlockBreadcrumbs,
		isDistractionFree,
	} = useSelect( ( select ) => {
		const { getEditorMode, isListViewOpened, isFeatureActive } =
			select( editPostStore );
		return {
			activeSidebar: select( interfaceStore ).getActiveComplementaryArea(
				editPostStore.name
			),
			editorMode: getEditorMode(),
			isListViewOpen: isListViewOpened(),
			isPublishSidebarEnabled:
				select( editorStore ).isPublishSidebarEnabled(),
			showBlockBreadcrumbs: isFeatureActive( 'showBlockBreadcrumbs' ),
			isDistractionFree: select( preferencesStore ).get(
				editPostStore.name,
				'distractionFree'
			),
		};
	}, [] );
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const { getCurrentPostId } = useSelect( editorStore );

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
		name: 'core/toggle-distraction-free',
		label: __( 'Toggle distraction free' ),
		callback: ( { close } ) => {
			toggleDistractionFree();
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-spotlight-mode',
		label: __( 'Toggle spotlight mode' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'focusMode' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-fullscreen-mode',
		label: __( 'Toggle fullscreen mode' ),
		icon: desktop,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fullscreenMode' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-list-view',
		label: __( 'Toggle list view' ),
		icon: listView,
		callback: ( { close } ) => {
			setIsListViewOpened( ! isListViewOpen );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-top-toolbar',
		label: __( 'Toggle top toolbar' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fixedToolbar' );
			if ( isDistractionFree ) {
				toggleDistractionFree();
			}
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-code-editor',
		label: __( 'Toggle code editor' ),
		icon: code,
		callback: ( { close } ) => {
			switchEditorMode( editorMode === 'visual' ? 'text' : 'visual' );
			close();
		},
	} );

	useCommand( {
		name: 'core/open-preferences',
		label: __( 'Editor preferences' ),
		callback: () => {
			openModal( PREFERENCES_MODAL_NAME );
		},
	} );

	useCommand( {
		name: 'core/open-shortcut-help',
		label: __( 'Keyboard shortcuts' ),
		icon: keyboard,
		callback: () => {
			openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
		},
	} );

	useCommand( {
		name: 'core/toggle-breadcrumbs',
		label: showBlockBreadcrumbs
			? __( 'Hide block breadcrumbs' )
			: __( 'Show block breadcrumbs' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'showBlockBreadcrumbs' );
			close();
			createInfoNotice(
				showBlockBreadcrumbs
					? __( 'Breadcrumbs hidden.' )
					: __( 'Breadcrumbs visible.' ),
				{
					id: 'core/edit-post/toggle-breadcrumbs/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	useCommand( {
		name: 'core/toggle-publish-sidebar',
		label: isPublishSidebarEnabled
			? __( 'Disable pre-publish checklist' )
			: __( 'Enable pre-publish checklist' ),
		icon: formatListBullets,
		callback: ( { close } ) => {
			close();
			toggle( 'core/edit-post', 'isPublishSidebarEnabled' );
			createInfoNotice(
				isPublishSidebarEnabled
					? __( 'Pre-publish checklist off.' )
					: __( 'Pre-publish checklist on.' ),
				{
					id: 'core/edit-post/publish-sidebar/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	useCommand( {
		name: 'core/preview-link',
		label: __( 'Preview in a new tab' ),
		icon: external,
		callback: async ( { close } ) => {
			close();
			const postId = getCurrentPostId();
			const link = await __unstableSaveForPreview();
			window.open( link, `wp-preview-${ postId }` );
		},
	} );
}
