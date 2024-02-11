/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function KeyboardShortcutsRegister() {
	// Registering the shortcuts.
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-site/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/toggle-block-settings-sidebar',
			category: 'global',
			description: __( 'Show or hide the Settings sidebar.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: ',',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/keyboard-shortcuts',
			category: 'main',
			description: __( 'Display these keyboard shortcuts.' ),
			keyCombination: {
				modifier: 'access',
				character: 'h',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/next-region',
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
			name: 'core/edit-site/previous-region',
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
		registerShortcut( {
			name: 'core/edit-site/toggle-mode',
			category: 'global',
			description: __( 'Switch between visual editor and code editor.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'm',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/transform-heading-to-paragraph',
			category: 'block-library',
			description: __( 'Transform heading to paragraph.' ),
			keyCombination: {
				modifier: 'access',
				character: `0`,
			},
		} );

		[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
			registerShortcut( {
				name: `core/edit-site/transform-paragraph-to-heading-${ level }`,
				category: 'block-library',
				description: __( 'Transform paragraph to heading.' ),
				keyCombination: {
					modifier: 'access',
					character: `${ level }`,
				},
			} );
		} );

		registerShortcut( {
			name: 'core/edit-site/toggle-distraction-free',
			category: 'global',
			description: __( 'Toggle distraction free mode.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: '\\',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

export default KeyboardShortcutsRegister;
