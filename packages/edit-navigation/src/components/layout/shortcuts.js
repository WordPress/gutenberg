/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

function NavigationEditorShortcuts( { saveBlocks } ) {
	useShortcut( 'core/edit-navigation/save-menu', ( event ) => {
		event.preventDefault();
		saveBlocks();
	} );

	const { redo, undo } = useDispatch( coreStore );
	useShortcut( 'core/edit-navigation/undo', ( event ) => {
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/edit-navigation/redo', ( event ) => {
		redo();
		event.preventDefault();
	} );

	return null;
}

function RegisterNavigationEditorShortcuts() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-navigation/save-menu',
			category: 'global',
			description: __( 'Save the navigation currently being edited.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
		registerShortcut( {
			name: 'core/edit-navigation/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );
		registerShortcut( {
			name: 'core/edit-navigation/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

NavigationEditorShortcuts.Register = RegisterNavigationEditorShortcuts;

export default NavigationEditorShortcuts;
