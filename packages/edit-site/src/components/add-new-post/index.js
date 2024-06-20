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
import { useDispatch, useRegistry } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { serialize, synchronizeBlocksWithTemplate } from '@wordpress/blocks';

// TODO: check how/if to reuse this and make it work for other post types.
// Currently this creates drafts, so we should look into that..
// Also lot's of labels need to be updated properly..
export default function AddNewPostModal( { postType, onSave, onClose } ) {
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ title, setTitle ] = useState( '' );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { resolveSelect } = useRegistry();

	async function createPage( event ) {
		event.preventDefault();

		if ( isCreatingPage ) {
			return;
		}
		setIsCreatingPage( true );
		try {
			// TODO: also check this change.. It was merged(https://github.com/WordPress/gutenberg/pull/62488/) as I was coding this..
			const pagePostType =
				await resolveSelect( coreStore ).getPostType( postType );
			const newPage = await saveEntityRecord(
				'postType',
				postType,
				{
					status: 'draft',
					title,
					slug: title || __( 'No title' ),
					content:
						!! pagePostType.template && pagePostType.template.length
							? serialize(
									synchronizeBlocksWithTemplate(
										[],
										pagePostType.template
									)
							  )
							: undefined,
				},
				{ throwOnError: true }
			);

			onSave( newPage );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					decodeEntities( newPage.title?.rendered || title )
				),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the item.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			setIsCreatingPage( false );
		}
	}

	return (
		<Modal
			title={ __( 'Draft a new page' ) }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form onSubmit={ createPage }>
				<VStack spacing={ 3 }>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Page title' ) }
						onChange={ setTitle }
						placeholder={ __( 'No title' ) }
						value={ title }
					/>
					<HStack spacing={ 2 } justify="end">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
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
