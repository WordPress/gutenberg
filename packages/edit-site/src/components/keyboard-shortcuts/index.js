/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

function KeyboardShortcuts() {
	const isListViewOpen = useSelect( ( select ) =>
		select( editSiteStore ).isListViewOpened()
	);
	const { redo, undo } = useDispatch( coreStore );
	const { setIsListViewOpened } = useDispatch( editSiteStore );

	useShortcut(
		'core/edit-site/undo',
		( event ) => {
			undo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-site/redo',
		( event ) => {
			redo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-site/toggle-list-view',
		useCallback( () => {
			setIsListViewOpened( ! isListViewOpen );
		}, [ isListViewOpen, setIsListViewOpened ] ),
		{ bindGlobal: true }
	);

	return null;
}
function KeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-site/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/toggle-list-view',
			category: 'global',
			description: __( 'Open the block list view.' ),
			keyCombination: {
				modifier: 'access',
				character: 'o',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
