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

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function KeyboardShortcuts() {
	const { toggleFullscreenMode } = useDispatch( editPostStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-fullscreen',
			category: 'global',
			description: __( 'Enable or disable fullscreen mode.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'f',
			},
		} );
	}, [] );

	useShortcut( 'core/edit-post/toggle-fullscreen', () => {
		toggleFullscreenMode();
	} );

	return null;
}

export default KeyboardShortcuts;
