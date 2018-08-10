/**
 * WordPress Dependencies
 */
import { withDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';

export function KeyboardShortcutsHelpMenuItem( { openModal, onSelect } ) {
	return (
		<MenuItem
			onClick={ () => {
				onSelect();
				openModal( 'edit-post/keyboard-shortcut-help' );
			} }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard Shortcuts' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch, ) => {
	const {
		openModal,
	} = dispatch( 'core/edit-post' );

	return {
		openModal,
	};
} )( KeyboardShortcutsHelpMenuItem );
