/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	code,
	cog,
	drawerLeft,
	drawerRight,
	blockDefault,
	keyboardClose,
	desktop,
	listView,
} from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

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
	} = useDispatch( editPostStore );
	const { openModal } = useDispatch( interfaceStore );
	const { editorMode, activeSidebar, isListViewOpen } = useSelect(
		( select ) => {
			const { getEditorMode, isListViewOpened } = select( editPostStore );
			return {
				activeSidebar: select(
					interfaceStore
				).getActiveComplementaryArea( editPostStore.name ),
				editorMode: getEditorMode(),
				isListViewOpen: isListViewOpened(),
			};
		},
		[]
	);
	const { toggle } = useDispatch( preferencesStore );

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
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'distractionFree' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-spotlight-mode',
		label: __( 'Toggle spotlight mode' ),
		icon: cog,
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
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fixedToolbar' );
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
		label: __( 'Open editor preferences' ),
		icon: cog,
		callback: () => {
			openModal( PREFERENCES_MODAL_NAME );
		},
	} );

	useCommand( {
		name: 'core/open-shortcut-help',
		label: __( 'Open keyboard shortcuts' ),
		icon: keyboardClose,
		callback: () => {
			openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
		},
	} );
}
