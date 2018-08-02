/**
 * WordPress Dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';

const modalName = 'edit-post/keyboard-shortcut-help';

export function KeyboardShortcutsToggle( { toggleModal, isModalActive } ) {
	return (
		<MenuItem
			icon={ isModalActive && 'yes' }
			isSelected={ isModalActive }
			onClick={ toggleModal }
		>
			{ __( 'Keyboard Shortcuts' ) }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isModalActive: select( 'core/edit-post' ).isModalActive( modalName ),
	} ) ),
	withDispatch( ( dispatch, { isModalActive } ) => {
		const {
			openModal,
			closeModal,
		} = dispatch( 'core/edit-post' );

		return {
			toggleModal: ( ) => isModalActive ? closeModal() : openModal( modalName ),
		};
	} ),
] )( KeyboardShortcutsToggle );
