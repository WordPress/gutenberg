/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

export default function RenamePostModalContent( { items, closeModal } ) {
	const [ item ] = items;
	const originalTitle = decodeEntities(
		typeof item.title === 'string' ? item.title : item.title.rendered
	);
	const [ title, setTitle ] = useState( () => originalTitle );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onRename( event ) {
		event.preventDefault();
		try {
			await editEntityRecord( 'postType', item.type, item.id, {
				title,
			} );
			// Update state before saving rerenders the list.
			setTitle( '' );
			closeModal();
			// Persist edited entity.
			await saveEditedEntityRecord( 'postType', item.type, item.id, {
				throwOnError: true,
			} );
			createSuccessNotice( __( 'Name updated' ), {
				id: 'page-update',
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the name' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<form onSubmit={ onRename }>
			<VStack spacing="5">
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					required
				/>
				<HStack justify="right">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							closeModal();
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
	);
}
