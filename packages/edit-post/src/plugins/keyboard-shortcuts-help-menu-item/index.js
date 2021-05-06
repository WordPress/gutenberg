/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export function KeyboardShortcutsHelpMenuItem( { openModal } ) {
	return (
		<MenuItem
			onClick={ () => {
				openModal( 'edit-post/keyboard-shortcut-help' );
			} }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard shortcuts' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( editPostStore );

	return {
		openModal,
	};
} )( KeyboardShortcutsHelpMenuItem );
