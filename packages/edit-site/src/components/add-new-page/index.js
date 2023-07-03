/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function AddNewPageModal( { onSave, onClose } ) {
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ title, setTitle ] = useState( '' );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	async function createPage( event ) {
		event.preventDefault();

		if ( isCreatingPage ) {
			return;
		}
		setIsCreatingPage( true );
		try {
			const newPage = await saveEntityRecord(
				'postType',
				'page',
				{
					status: 'draft',
					title,
					slug: title || __( 'No title' ),
				},
				{ throwOnError: true }
			);

			onSave( newPage );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					newPage.title?.rendered || title
				),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the page.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			setIsCreatingPage( false );
		}
	}

	return (
		<Modal title={ __( 'Draft a new page' ) } onRequestClose={ onClose }>
			<form onSubmit={ createPage }>
				<VStack spacing={ 3 }>
					<TextControl
						/* eslint-disable jsx-a11y/no-autofocus */
						autoFocus
						/* eslint-enable jsx-a11y/no-autofocus */
						label={ __( 'Page title' ) }
						onChange={ setTitle }
						placeholder={ __( 'No title' ) }
						value={ title }
					/>
					<HStack spacing={ 2 } justify="end">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							isBusy={ isCreatingPage }
							aria-disabled={ isCreatingPage }
						>
							{ __( 'Create draft' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
