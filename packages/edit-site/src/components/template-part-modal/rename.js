/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import RenameTemplatePartModal from '../rename-template-part-modal';
import { TEMPLATE_PART_MODALS } from './';
import useEditedEntityRecord from '../use-edited-entity-record';

export default function TemplatePartRenameModal() {
	const { record } = useEditedEntityRecord();
	const { closeModal } = useDispatch( interfaceStore );
	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( TEMPLATE_PART_MODALS.rename )
	);

	if ( ! isActive ) {
		return null;
	}

	return (
		<RenameTemplatePartModal
			onClose={ closeModal }
			templatePart={ record }
		/>
	);
}
