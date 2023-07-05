/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CreatePatternModal from '../create-pattern-modal';
import CreateTemplatePartModal from '../create-template-part-modal';
import { TEMPLATE_PARTS } from './utils';

export default function DuplicateMenuItem( {
	item,
	label = __( 'Duplicate' ),
	onClose,
} ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	function handleClose() {
		setIsModalOpen( false );
		onClose();
	}

	const CreateModal =
		item.type === TEMPLATE_PARTS
			? CreateTemplatePartModal
			: CreatePatternModal;

	const modalProps = {
		blocks: item.blocks || [],
		closeModal: handleClose,
		onCreate: handleClose,
		onError: handleClose,
		title:
			item.type !== TEMPLATE_PARTS
				? __( 'Duplicate pattern' )
				: undefined,
	};

	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) }>
				{ label }
			</MenuItem>
			{ isModalOpen && <CreateModal { ...modalProps } /> }
		</>
	);
}
