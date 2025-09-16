/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';

function KeyboardShortcuts() {
	return null;
}

function KeyboardShortcutsRegister() {
	// Registering the shortcuts.
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/block-editor/copy',
			category: 'block',
			description: __( 'Copy the selected block(s).' ),
			keyCombination: {
				modifier: 'primary',
				character: 'c',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/cut',
			category: 'block',
			description: __( 'Cut the selected block(s).' ),
			keyCombination: {
				modifier: 'primary',
				character: 'x',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/paste',
			category: 'block',
			description: __( 'Paste the selected block(s).' ),
			keyCombination: {
				modifier: 'primary',
				character: 'v',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/duplicate',
			category: 'block',
			description: __( 'Duplicate the selected block(s).' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'd',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/remove',
			category: 'block',
			description: __( 'Remove the selected block(s).' ),
			keyCombination: {
				modifier: 'access',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/paste-styles',
			category: 'block',
			description: __(
				'Paste the copied style to the selected block(s).'
			),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 'v',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/insert-before',
			category: 'block',
			description: __(
				'Insert a new block before the selected block(s).'
			),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 't',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/insert-after',
			category: 'block',
			description: __(
				'Insert a new block after the selected block(s).'
			),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 'y',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/delete-multi-selection',
			category: 'block',
			description: __( 'Delete selection.' ),
			keyCombination: {
				character: 'del',
			},
			aliases: [
				{
					character: 'backspace',
				},
			],
		} );

		registerShortcut( {
			name: 'core/block-editor/select-all',
			category: 'selection',
			description: __(
				'Select all text when typing. Press again to select all blocks.'
			),
			keyCombination: {
				modifier: 'primary',
				character: 'a',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/unselect',
			category: 'selection',
			description: __( 'Clear selection.' ),
			keyCombination: {
				character: 'escape',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/multi-text-selection',
			category: 'selection',
			description: __( 'Select text across multiple blocks.' ),
			keyCombination: {
				modifier: 'shift',
				character: 'arrow',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/focus-toolbar',
			category: 'global',
			description: __( 'Navigate to the nearest toolbar.' ),
			keyCombination: {
				modifier: 'alt',
				character: 'F10',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-up',
			category: 'block',
			description: __( 'Move the selected block(s) up.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 't',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-down',
			category: 'block',
			description: __( 'Move the selected block(s) down.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'y',
			},
		} );

		// List view shortcuts.
		registerShortcut( {
			name: 'core/block-editor/collapse-list-view',
			category: 'list-view',
			description: __( 'Collapse all other items.' ),
			keyCombination: {
				modifier: 'alt',
				character: 'l',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/group',
			category: 'block',
			description: __(
				'Create a group block from the selected multiple blocks.'
			),
			keyCombination: {
				modifier: 'primary',
				character: 'g',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;

export default KeyboardShortcuts;
