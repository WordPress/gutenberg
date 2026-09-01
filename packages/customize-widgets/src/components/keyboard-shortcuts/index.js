import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const { usesNativeUndo } = unlock( blockEditorPrivateApis );

function KeyboardShortcuts( { undo, redo, save } ) {
	useShortcut( 'core/customize-widgets/undo', ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/customize-widgets/redo', ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		redo();
		event.preventDefault();
	} );

	useShortcut( 'core/customize-widgets/save', ( event ) => {
		event.preventDefault();
		save();
	} );

	return null;
}

function KeyboardShortcutsRegister() {
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: 'core/customize-widgets/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/customize-widgets/redo',
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

		registerShortcut( {
			name: 'core/customize-widgets/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		return () => {
			unregisterShortcut( 'core/customize-widgets/undo' );
			unregisterShortcut( 'core/customize-widgets/redo' );
			unregisterShortcut( 'core/customize-widgets/save' );
		};
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
