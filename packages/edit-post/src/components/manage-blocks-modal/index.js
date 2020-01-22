/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockManager from './manager';

/**
 * Unique identifier for Manage Blocks modal.
 *
 * @type {string}
 */
const MODAL_NAME = 'edit-post/manage-blocks';

export function ManageBlocksModal( { isActive, closeModal } ) {
	if ( ! isActive ) {
		return null;
	}

	return (
		<Modal
			className="edit-post-manage-blocks-modal"
			title={ __( 'Block Manager' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
		>
			<BlockManager />
		</Modal>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isModalActive } = select( 'core/edit-post' );

		return {
			isActive: isModalActive( MODAL_NAME ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { closeModal } = dispatch( 'core/edit-post' );

		return {
			closeModal,
		};
	} ),
] )( ManageBlocksModal );
