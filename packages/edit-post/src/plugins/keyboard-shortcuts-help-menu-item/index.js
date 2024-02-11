/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { KEYBOARD_SHORTCUT_HELP_MODAL_NAME } from '../../components/keyboard-shortcut-help-modal';

export function KeyboardShortcutsHelpMenuItem( { openModal } ) {
	return (
		<MenuItem
			onClick={ () => {
				openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
			} }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard shortcuts' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( interfaceStore );

	return {
		openModal,
	};
} )( KeyboardShortcutsHelpMenuItem );
