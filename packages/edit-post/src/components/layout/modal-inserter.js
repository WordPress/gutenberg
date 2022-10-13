/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { Inserter } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export function ModalInserter() {
	const { setIsInserterOpened } = useDispatch( editPostStore );
	const closeModal = () => {
		setIsInserterOpened( false );
	};
	return (
		<Modal onRequestClose={ closeModal } title={ __( 'Insert block' ) }>
			<Inserter __experimentalIsModal />
		</Modal>
	);
}
