/**
 * WordPress dependencies
 */
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

export function RichTextShortcut( { character, type, onUse } ) {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const name = 'unstable/' + type + '/' + character;

	deprecated( 'wp.blockEditor.RichTextShortcut', {
		alternative: 'wp.keyboardShortcuts.useShortcut',
	} );

	useShortcut( name, ( event ) => {
		onUse();
		event.preventDefault();
	} );
	useEffect( () => {
		registerShortcut( {
			name,
			category: 'text',
			keyCombination: {
				modifier: type,
				character,
			},
		} );
	}, [ registerShortcut ] );

	return null;
}
