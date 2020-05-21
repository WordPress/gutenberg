/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

export function KeyboardShortcutsHelpMenuItem( { openModal } ) {
	return (
		<MenuItem
			disabled
			onClick={ () => {
				openModal( 'edit-site/keyboard-shortcut-help' );
			} }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard shortcuts' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( 'core/edit-site' );

	return {
		openModal,
	};
} )( KeyboardShortcutsHelpMenuItem );
