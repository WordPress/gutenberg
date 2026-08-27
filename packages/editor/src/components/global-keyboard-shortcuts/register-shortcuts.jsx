import { useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';
import { useCanSuggest } from '../suggestion-mode/gate';

/**
 * The intent shortcuts, kept together so they are registered and removed as
 * one set. Names only: the descriptions are translated at registration time.
 *
 * @type {string[]}
 */
const INTENT_SHORTCUT_NAMES = [
	'core/editor/intent-edit',
	'core/editor/intent-suggest',
	'core/editor/intent-view',
];

/**
 * Component for registering editor keyboard shortcuts.
 *
 * @return {Element} The component to be rendered.
 */
function EditorKeyboardShortcutsRegister() {
	// Registering the shortcuts.
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);
	useEffect( () => {
		registerShortcut( {
			name: 'core/editor/toggle-mode',
			category: 'global',
			description: __( 'Switch between visual editor and code editor.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'm',
			},
		} );

		registerShortcut( {
			name: 'core/editor/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/editor/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/editor/redo',
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
			name: 'core/editor/toggle-list-view',
			category: 'global',
			description: __( 'Show or hide the List View.' ),
			keyCombination: {
				modifier: 'access',
				character: 'o',
			},
		} );

		registerShortcut( {
			name: 'core/editor/toggle-distraction-free',
			category: 'global',
			description: __( 'Enter or exit distraction free mode.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: '\\',
			},
		} );

		registerShortcut( {
			name: 'core/editor/toggle-sidebar',
			category: 'global',
			description: __( 'Show or hide the Settings panel.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: ',',
			},
		} );

		registerShortcut( {
			name: 'core/editor/keyboard-shortcuts',
			category: 'main',
			description: __( 'Display these keyboard shortcuts.' ),
			keyCombination: {
				modifier: 'access',
				character: 'h',
			},
		} );

		registerShortcut( {
			name: 'core/editor/new-note',
			category: 'block',
			description: __( 'Add a new note.' ),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 'm',
			},
		} );

		registerShortcut( {
			name: 'core/editor/next-region',
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
			name: 'core/editor/previous-region',
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
	}, [ registerShortcut ] );

	/*
	 * The intent shortcuts follow the same runtime gate as the Mode menu and
	 * the shortcut handlers: the Suggestion Mode experiment AND `editor.notes`
	 * support on the current post type. Registration is what lists a shortcut
	 * in the Keyboard Shortcuts help modal, so gating registration on the
	 * experiment flag alone advertised "Switch to Suggest mode." on screens
	 * that can never act on it. The Site Editor listed it for `wp_template`,
	 * which has no notes support, renders no Mode menu, and does nothing when
	 * the combination is pressed.
	 *
	 * `editor.notes` support arrives with the post type record, so the
	 * predicate starts false and flips once it resolves. The set is removed
	 * again if it flips back, which is why the effect is keyed on it.
	 */
	const canSuggest = useCanSuggest();
	const intentShortcutsRegisteredRef = useRef( false );
	useEffect( () => {
		if ( canSuggest ) {
			registerShortcut( {
				name: 'core/editor/intent-edit',
				category: 'global',
				description: __( 'Switch to Edit mode.' ),
				keyCombination: {
					modifier: 'secondary',
					character: 'z',
				},
			} );

			registerShortcut( {
				name: 'core/editor/intent-suggest',
				category: 'global',
				description: __( 'Switch to Suggest mode.' ),
				keyCombination: {
					modifier: 'secondary',
					character: 'x',
				},
			} );

			registerShortcut( {
				name: 'core/editor/intent-view',
				category: 'global',
				description: __( 'Switch to View mode.' ),
				keyCombination: {
					modifier: 'secondary',
					character: 'c',
				},
			} );

			intentShortcutsRegisteredRef.current = true;
			return;
		}

		if ( intentShortcutsRegisteredRef.current ) {
			INTENT_SHORTCUT_NAMES.forEach( ( name ) =>
				unregisterShortcut( name )
			);
			intentShortcutsRegisteredRef.current = false;
		}
	}, [ canSuggest, registerShortcut, unregisterShortcut ] );

	return <BlockEditorKeyboardShortcuts.Register />;
}

export default EditorKeyboardShortcutsRegister;
