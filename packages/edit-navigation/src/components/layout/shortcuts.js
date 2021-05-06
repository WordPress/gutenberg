/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';

function NavigationEditorShortcuts( { saveBlocks } ) {
	useShortcut(
		'core/edit-navigation/save-menu',
		useCallback( ( event ) => {
			event.preventDefault();
			saveBlocks();
		} ),
		{
			bindGlobal: true,
		}
	);

	const { redo, undo } = useDispatch( 'core' );
	useShortcut(
		'core/edit-navigation/undo',
		( event ) => {
			undo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-navigation/redo',
		( event ) => {
			redo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

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
