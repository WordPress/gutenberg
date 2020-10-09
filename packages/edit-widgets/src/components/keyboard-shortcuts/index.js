/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function KeyboardShortcuts() {
	const { redo, undo } = useDispatch( 'core' );
	const { saveEditedWidgetAreas } = useDispatch( 'core/edit-widgets' );

	useShortcut(
		'core/edit-widgets/undo',
		( event ) => {
			undo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-widgets/redo',
		( event ) => {
			redo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-widgets/save',
		( event ) => {
			event.preventDefault();
			saveEditedWidgetAreas();
		},
		{ bindGlobal: true }
	);

	return null;
}

function KeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-widgets/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-widgets/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-widgets/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
