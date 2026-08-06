/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Register keyboard shortcuts for grid block item movement.
 *
 * @return {Element} The component to be rendered.
 */
function RegisterGridMovementShortcuts() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: 'core/block-editor/move-grid-item-left',
			category: 'block',
			description: __( 'Move grid block item left' ),
			keyCombination: {
				modifier: 'shiftAlt',
				character: 'ArrowLeft',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-grid-item-right',
			category: 'block',
			description: __( 'Move grid block item right' ),
			keyCombination: {
				modifier: 'shiftAlt',
				character: 'ArrowRight',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-grid-item-up',
			category: 'block',
			description: __( 'Move grid block item up' ),
			keyCombination: {
				modifier: 'shiftAlt',
				character: 'ArrowUp',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-grid-item-down',
			category: 'block',
			description: __( 'Move grid block item down' ),
			keyCombination: {
				modifier: 'shiftAlt',
				character: 'ArrowDown',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

export default RegisterGridMovementShortcuts;
