/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';

function KeyboardShortcuts() {
	const {
		getBlockSelectionStart,
		getEditorMode,
		isEditorSidebarOpened,
		richEditingEnabled,
		codeEditingEnabled,
	} = useSelect( ( select ) => {
		const settings = select( 'core/editor' ).getEditorSettings();
		return {
			getBlockSelectionStart: select( 'core/block-editor' )
				.getBlockSelectionStart,
			getEditorMode: select( 'core/edit-post' ).getEditorMode,
			isEditorSidebarOpened: select( 'core/edit-post' )
				.isEditorSidebarOpened,
			richEditingEnabled: settings.richEditingEnabled,
			codeEditingEnabled: settings.codeEditingEnabled,
		};
	} );

	const {
		switchEditorMode,
		openGeneralSidebar,
		closeGeneralSidebar,
	} = useDispatch( 'core/edit-post' );
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-mode',
			category: 'global',
			description: __( 'Switch between Visual editor and Code editor.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'm',
			},
		} );

		registerShortcut( {
			name: 'core/edit-post/toggle-block-navigation',
			category: 'global',
			description: __( 'Open the block navigation menu.' ),
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
			isDisabled: ! richEditingEnabled || ! codeEditingEnabled,
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

	return null;
}

export default KeyboardShortcuts;
