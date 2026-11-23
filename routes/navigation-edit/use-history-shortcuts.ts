import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

const { usesNativeUndo } = unlock( blockEditorPrivateApis );

// Named apart from the editor's `core/editor/undo` and `core/editor/redo`, so
// that unregistering these when the screen closes leaves the editor's alone.
const UNDO_SHORTCUT = 'core/navigation-edit/undo';
const REDO_SHORTCUT = 'core/navigation-edit/redo';

/**
 * Undoes and redoes the menu edits with the same keyboard shortcuts as the
 * editor, whose own shortcuts are off while its canvas is a preview.
 */
export default function useHistoryShortcuts() {
	const { undo, redo } = useDispatch( coreStore );
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: UNDO_SHORTCUT,
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );
		registerShortcut( {
			name: REDO_SHORTCUT,
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
			// Matches the editor: Ctrl+Y is an alias everywhere except Apple
			// OS, where Cmd+Y opens the browser history.
			aliases: isAppleOS()
				? []
				: [
						{
							modifier: 'primary',
							character: 'y',
						},
					],
		} );
		return () => {
			unregisterShortcut( UNDO_SHORTCUT );
			unregisterShortcut( REDO_SHORTCUT );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut( UNDO_SHORTCUT, ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		undo();
		event.preventDefault();
	} );

	useShortcut( REDO_SHORTCUT, ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		redo();
		event.preventDefault();
	} );
}
