/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Flex,
	FlexItem,
	MenuItem,
	Modal,
	TextControl,
} from '@wordpress/components';

export default function RenameMenuItem( { template, onClose } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const [ title, setTitle ] = useEntityProp(
		'postType',
		template.type,
		'title',
		template.id
	);

	async function onTemplateRename( event ) {
		event.preventDefault();
		setIsModalOpen( false );
		onClose();

		// Presist edited entity.
		await saveEditedEntityRecord( 'postType', template.type, template.id );
	}

	return (
		<>
			<MenuItem
				onClick={ () => {
					setIsModalOpen( true );
				} }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Rename template' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="edit-site-template__modal"
				>
					<form onSubmit={ onTemplateRename }>
						<Flex align="flex-start" gap={ 8 }>
							<FlexItem>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
								/>
							</FlexItem>
						</Flex>

						<Flex
							className="edit-site-template__modal-actions"
							justify="flex-end"
							expanded={ false }
						>
							<FlexItem>
								<Button
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button variant="primary" type="submit">
									{ __( 'Save' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
		</>
	);
}
