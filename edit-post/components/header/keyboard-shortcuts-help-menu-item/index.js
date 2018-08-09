/**
 * External Dependencies
 */
import { flow } from 'lodash';

/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';

const MODAL_NAME = 'edit-post/keyboard-shortcut-help';

export function KeyboardShortcutsHelpMenuItem( { toggleModal, onSelect } ) {
	return (
		<MenuItem
			onClick={ flow( onSelect, toggleModal ) }
			shortcut={ displayShortcut.access( 'h' ) }
		>
			{ __( 'Keyboard Shortcuts' ) }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isModalActive: select( 'core/edit-post' ).isModalActive( MODAL_NAME ),
	} ) ),
	withDispatch( ( dispatch, { isModalActive } ) => {
		const {
			openModal,
			closeModal,
		} = dispatch( 'core/edit-post' );

		return {
			toggleModal: ( ) => isModalActive ? closeModal() : openModal( MODAL_NAME ),
		};
	} ),
] )( KeyboardShortcutsHelpMenuItem );
