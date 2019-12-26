/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';

function EditorModeKeyboardShortcuts() {
	const {
		getBlockSelectionStart,
		getEditorSettings,
		getEditorMode,
		isEditorSidebarOpen,
	} = useSelect( ( select ) => {
		return {
			getBlockSelectionStart: select( 'core/block-editor' ).getBlockSelectionStart,
			getEditorSettings: select( 'core/editor' ).getEditorSettings,
			getEditorMode: select( 'core/edit-post' ).getEditorMode,
			isEditorSidebarOpened: select( 'core/edit-post' ).isEditorSidebarOpened,
		};
	} );

	const {
		switchEditorMode,
		openGeneralSidebar,
		closeGeneralSidebar,
	} = useDispatch( 'core/edit-post' );
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-mode',
			category: 'global',
			description: __( 'Switch between Visual editor and Code editor.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'm',
			},
		} );

		registerShortcut( {
			name: 'core/edit-post/toggle-sidebar',
			category: 'global',
			description: __( 'Show or hide the settings sidebar.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: ',',
			},
		} );

		registerShortcut( {
			name: 'core/edit-post/next-region',
			category: 'global',
			description: __( 'Navigate to the next part of the editor.' ),
			keyCombination: {
				modifier: 'ctrl',
				character: '`',
			},
			aliases: [ {
				modifier: 'access',
				character: 'n',
			} ],
		} );

		registerShortcut( {
			name: 'core/edit-post/previous-region',
			category: 'global',
			description: __( 'Navigate to the previous part of the editor.' ),
			keyCombination: {
				modifier: 'ctrlShift',
				character: '`',
			},
			aliases: [ {
				modifier: 'access',
				character: 'p',
			} ],
		} );
	}, [] );

	useShortcut( 'core/edit-post/toggle-mode', () => {
		const { richEditingEnabled, codeEditingEnabled } = getEditorSettings();
		if ( ! richEditingEnabled || ! codeEditingEnabled ) {
			return;
		}
		switchEditorMode( getEditorMode() === 'visual' ? 'text' : 'visual' );
	}, { bindGlobal: true } );

	useShortcut( 'core/edit-post/toggle-sidebar', ( event ) => {
		// This shortcut has no known clashes, but use preventDefault to prevent any
		// obscure shortcuts from triggering.
		event.preventDefault();

		if ( isEditorSidebarOpen ) {
			closeGeneralSidebar();
		} else {
			const sidebarToOpen = getBlockSelectionStart() ? 'edit-post/block' : 'edit-post/document';
			openGeneralSidebar( sidebarToOpen );
		}
	}, { bindGlobal: true } );

	return null;
}

export default EditorModeKeyboardShortcuts;
