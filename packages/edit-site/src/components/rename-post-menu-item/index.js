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

export default function RenamePostMenuItem( { post } ) {
	const title = decodeEntities(
		typeof post.title === 'string' ? post.title : post.title.rendered
	);
	const [ editedTitle, setEditedTitle ] = useState( title );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const {
		editEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	if ( post.type === TEMPLATE_POST_TYPE && ! post.is_custom ) {
		return null;
	}

	async function onRename( event ) {
		event.preventDefault();

		if ( editedTitle === title ) {
			return;
		}

		try {
			await editEntityRecord( 'postType', post.type, post.id, {
				title: editedTitle,
			} );

			// Update state before saving rerenders the list.
			setEditedTitle( '' );
			setIsModalOpen( false );

			// Persist edited entity.
			await saveSpecifiedEntityEdits(
				'postType',
				post.type,
				post.id,
				[ 'title' ], // Only save title to avoid persisting other edits.
				{
					throwOnError: true,
				}
			);

			createSuccessNotice( __( 'Name updated.' ), {
				id: 'template-update',
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the name.' );

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
					focusOnMount="firstContentElement"
				>
					<form onSubmit={ onRename }>
						<VStack spacing="5">
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Name' ) }
								value={ editedTitle }
								onChange={ setEditedTitle }
								required
							/>

							<HStack justify="right">
								<Button
									__next40pxDefaultSize
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
								>
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
