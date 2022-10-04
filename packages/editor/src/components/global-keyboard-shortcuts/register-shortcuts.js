/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';

function EditorKeyboardShortcutsRegister() {
	// Registering the shortcuts.
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/editor/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/editor/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/editor/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
			// Disable on Apple OS because it conflicts with the browser's
			// history shortcut. It's a fine alias for both Windows and Linux.
			// Since there's no conflict for Ctrl+Shift+Z on both Windows and
			// Linux, we keep it as the default for consistency.
			aliases: isAppleOS()
				? []
				: [
						{
							modifier: 'primary',
							character: 'y',
						},
				  ],
		} );
	}, [ registerShortcut ] );

	return <BlockEditorKeyboardShortcuts.Register />;
}

export default EditorKeyboardShortcutsRegister;
