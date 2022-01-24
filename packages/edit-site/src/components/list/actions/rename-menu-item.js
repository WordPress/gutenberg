/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	Flex,
	FlexItem,
	MenuItem,
	Modal,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function RenameMenuItem( { template, onClose } ) {
	const [ title, setTitle ] = useState( () => template.title.rendered );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { getLastEntitySaveError } = useSelect( coreStore );
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch(
		coreStore
	);
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		noticesStore
	);

	if ( ! template.is_custom ) {
		return null;
	}

	async function onTemplateRename( event ) {
		event.preventDefault();

		try {
			await editEntityRecord( 'postType', template.type, template.id, {
				title,
			} );

			// Update state before saving rerenders the list.
			setTitle( '' );
			setIsModalOpen( false );
			onClose();

			// Persist edited entity.
			await saveEditedEntityRecord(
				'postType',
				template.type,
				template.id
			);

			const lastError = getLastEntitySaveError(
				'postType',
				template.type,
				template.id
			);

			if ( lastError ) {
				throw lastError;
			}

			createSuccessNotice( __( 'Entity renamed.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while renaming the entity.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<>
			<MenuItem
				onClick={ () => {
					setIsModalOpen( true );
					setTitle( template.title.rendered );
				} }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Rename' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="edit-site-list__rename-modal"
				>
					<form onSubmit={ onTemplateRename }>
						<Flex align="flex-start" gap={ 8 }>
							<FlexItem>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
									required
								/>
							</FlexItem>
						</Flex>

						<Flex
							className="edit-site-list__rename-modal-actions"
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
