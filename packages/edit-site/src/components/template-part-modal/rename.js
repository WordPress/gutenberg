/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_MODALS } from './';
import useEditedEntityRecord from '../use-edited-entity-record';

function RenameModal( { onClose, templatePart, ...props } ) {
	const originalName =
		typeof templatePart.title === 'string'
			? templatePart.title
			: templatePart.title.raw;
	const [ name, setName ] = useState( decodeEntities( originalName ) );
	const [ isSaving, setIsSaving ] = useState( false );

	const {
		editEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const onRename = async ( event ) => {
		event.preventDefault();

		if ( ! name || name === templatePart.title || isSaving ) {
			return;
		}

		try {
			await editEntityRecord(
				'postType',
				templatePart.type,
				templatePart.id,
				{
					title: name,
				}
			);

			setIsSaving( true );
			setName( '' );
			onClose?.();

			await saveSpecifiedEntityEdits(
				'postType',
				templatePart.type,
				templatePart.id,
				[ 'title' ],
				{ throwOnError: true }
			);

			createSuccessNotice( __( 'Template part renamed' ), {
				type: 'snackbar',
				id: 'template-part-update',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while renaming the template part.'
					  );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
				id: 'template-part-update',
			} );
		} finally {
			setIsSaving( false );
			setName( '' );
		}
	};

	const onRequestClose = () => {
		onClose?.();
		setName( '' );
	};

	return (
		<Modal title={ __( 'Rename' ) } { ...props } onRequestClose={ onClose }>
			<form onSubmit={ onRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ name }
						onChange={ setName }
						required
					/>

					<HStack justify="right">
						<Button variant="tertiary" onClick={ onRequestClose }>
							{ __( 'Cancel' ) }
						</Button>

						<Button variant="primary" type="submit">
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

export default function TemplatePartRenameModal() {
	const { record } = useEditedEntityRecord();
	const { closeModal } = useDispatch( interfaceStore );
	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( TEMPLATE_PART_MODALS.rename )
	);

	if ( ! isActive ) {
		return null;
	}

	return <RenameModal onClose={ closeModal } templatePart={ record } />;
}
