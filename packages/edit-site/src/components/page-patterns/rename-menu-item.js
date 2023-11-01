/**
 * WordPress dependencies
 */
import {
	Button,
	MenuItem,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

export default function RenameMenuItem( { item, onClose } ) {
	const [ title, setTitle ] = useState( () => item.title );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	if ( item.type === TEMPLATE_PART_POST_TYPE && ! item.isCustom ) {
		return null;
	}

	async function onRename( event ) {
		event.preventDefault();

		try {
			await editEntityRecord( 'postType', item.type, item.id, { title } );

			// Update state before saving rerenders the list.
			setTitle( '' );
			setIsModalOpen( false );
			onClose();

			// Persist edited entity.
			await saveEditedEntityRecord( 'postType', item.type, item.id, {
				throwOnError: true,
			} );

			createSuccessNotice(
				item.type === TEMPLATE_PART_POST_TYPE
					? __( 'Template part renamed.' )
					: __( 'Pattern renamed.' ),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const fallbackErrorMessage =
				item.type === TEMPLATE_PART_POST_TYPE
					? __(
							'An error occurred while renaming the template part.'
					  )
					: __( 'An error occurred while renaming the pattern.' );
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: fallbackErrorMessage;

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<>
			<MenuItem
				onClick={ () => {
					setIsModalOpen( true );
					setTitle( item.title );
				} }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Rename' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
						onClose();
					} }
					overlayClassName="edit-site-list__rename-modal"
				>
					<form onSubmit={ onRename }>
						<VStack spacing="5">
							<TextControl
								__nextHasNoMarginBottom
								label={ __( 'Name' ) }
								value={ title }
								onChange={ setTitle }
								required
							/>

							<HStack justify="right">
								<Button
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
										onClose();
									} }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button variant="primary" type="submit">
									{ __( 'Save' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
