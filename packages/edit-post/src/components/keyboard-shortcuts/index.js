/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function KeyboardShortcuts() {
	const { isEditorSidebarOpened } = useSelect( editPostStore );
	const { openGeneralSidebar, closeGeneralSidebar, toggleFeature } =
		useDispatch( editPostStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const { getBlockSelectionStart } = useSelect( blockEditorStore );

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-fullscreen',
			category: 'global',
			description: __( 'Toggle fullscreen mode.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'f',
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
			aliases: [
				{
					modifier: 'access',
					character: 'n',
				},
			],
		} );

		registerShortcut( {
			name: 'core/edit-post/previous-region',
			category: 'global',
			description: __( 'Navigate to the previous part of the editor.' ),
			keyCombination: {
				modifier: 'ctrlShift',
				character: '`',
			},
			aliases: [
				{
					modifier: 'access',
					character: 'p',
				},
				{
					modifier: 'ctrlShift',
					character: '~',
				},
			],
		} );
	}, [] );

	useShortcut( 'core/edit-post/toggle-fullscreen', () => {
		toggleFeature( 'fullscreenMode' );
	} );

	useShortcut( 'core/edit-post/toggle-sidebar', ( event ) => {
		// This shortcut has no known clashes, but use preventDefault to prevent any
		// obscure shortcuts from triggering.
		event.preventDefault();

		if ( isEditorSidebarOpened() ) {
			closeGeneralSidebar();
		} else {
			const sidebarToOpen = getBlockSelectionStart()
				? 'edit-post/block'
				: 'edit-post/document';
			openGeneralSidebar( sidebarToOpen );
		}
	} );

	return null;
}

export default KeyboardShortcuts;
