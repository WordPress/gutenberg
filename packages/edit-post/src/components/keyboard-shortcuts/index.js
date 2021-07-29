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
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function KeyboardShortcuts() {
	const { getBlockSelectionStart } = useSelect( blockEditorStore );
	const {
		getEditorMode,
		isEditorSidebarOpened,
		isListViewOpened,
	} = useSelect( editPostStore );
	const isModeToggleDisabled = useSelect( ( select ) => {
		const { richEditingEnabled, codeEditingEnabled } = select(
			editorStore
		).getEditorSettings();
		return ! richEditingEnabled || ! codeEditingEnabled;
	}, [] );

	const {
		switchEditorMode,
		openGeneralSidebar,
		closeGeneralSidebar,
		toggleFeature,
		setIsListViewOpened,
	} = useDispatch( editPostStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-mode',
			category: 'global',
			description: __( 'Switch between visual editor and code editor.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'm',
			},
		} );

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
			name: 'core/edit-post/toggle-list-view',
			category: 'global',
			description: __( 'Open the block list view.' ),
			keyCombination: {
				modifier: 'access',
				character: 'o',
			},
		} );

		registerShortcut( {
			name: 'core/edit-post/toggle-sidebar',
			category: 'global',
			description: __( 'Show or hide the settings sidebar.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: ',',
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
			],
		} );

		registerShortcut( {
			name: 'core/edit-post/keyboard-shortcuts',
			category: 'main',
			description: __( 'Display these keyboard shortcuts.' ),
			keyCombination: {
				modifier: 'access',
				character: 'h',
			},
		} );
	}, [] );

	useShortcut(
		'core/edit-post/toggle-mode',
		() => {
			switchEditorMode(
				getEditorMode() === 'visual' ? 'text' : 'visual'
			);
		},
		{
			bindGlobal: true,
			isDisabled: isModeToggleDisabled,
		}
	);

	useShortcut(
		'core/edit-post/toggle-fullscreen',
		() => {
			toggleFeature( 'fullscreenMode' );
		},
		{
			bindGlobal: true,
		}
	);

	useShortcut(
		'core/edit-post/toggle-sidebar',
		( event ) => {
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
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-post/toggle-list-view',
		() => setIsListViewOpened( ! isListViewOpened() ),
		{ bindGlobal: true }
	);

	return null;
}

export default KeyboardShortcuts;
