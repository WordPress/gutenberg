/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	Button,
	MenuItem,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

export default function RenameMenuItem( { template, onClose } ) {
	const title = decodeEntities( template.title.rendered );
	const [ editedTitle, setEditedTitle ] = useState( title );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const {
		editEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	if ( template.type === TEMPLATE_POST_TYPE && ! template.is_custom ) {
		return null;
	}

	async function onTemplateRename( event ) {
		event.preventDefault();

		try {
			await editEntityRecord( 'postType', template.type, template.id, {
				title: editedTitle,
			} );

			// Update state before saving rerenders the list.
			setEditedTitle( '' );
			setIsModalOpen( false );
			onClose();

			// Persist edited entity.
			await saveSpecifiedEntityEdits(
				'postType',
				template.type,
				template.id,
				[ 'title' ], // Only save title to avoid persisting other edits.
				{
					throwOnError: true,
				}
			);

			createSuccessNotice(
				template.type === TEMPLATE_POST_TYPE
					? __( 'Template renamed.' )
					: __( 'Template part renamed.' ),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const fallbackErrorMessage =
				template.type === TEMPLATE_POST_TYPE
					? __( 'An error occurred while renaming the template.' )
					: __(
							'An error occurred while renaming the template part.'
					  );
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
					setEditedTitle( title );
				} }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Rename' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="edit-site-list__rename-modal"
				>
					<form onSubmit={ onTemplateRename }>
						<VStack spacing="5">
							<TextControl
								__nextHasNoMarginBottom
								label={ __( 'Name' ) }
								value={ editedTitle }
								onChange={ setEditedTitle }
								required
							/>

							<HStack justify="right">
								<Button
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
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
