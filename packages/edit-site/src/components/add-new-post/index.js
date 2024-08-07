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
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { serialize, synchronizeBlocksWithTemplate } from '@wordpress/blocks';

export default function AddNewPostModal( { postType, onSave, onClose } ) {
	const labels = useSelect(
		( select ) => select( coreStore ).getPostType( postType )?.labels,
		[ postType ]
	);
	const [ isCreatingPost, setIsCreatingPost ] = useState( false );
	const [ title, setTitle ] = useState( '' );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { resolveSelect } = useRegistry();

	async function createPost( event ) {
		event.preventDefault();

		if ( isCreatingPost ) {
			return;
		}
		setIsCreatingPost( true );
		try {
			const postTypeObject =
				await resolveSelect( coreStore ).getPostType( postType );
			const newPage = await saveEntityRecord(
				'postType',
				postType,
				{
					status: 'draft',
					title,
					slug: title || __( 'No title' ),
					content:
						!! postTypeObject.template &&
						postTypeObject.template.length
							? serialize(
									synchronizeBlocksWithTemplate(
										[],
										postTypeObject.template
									)
							  )
							: undefined,
				},
				{ throwOnError: true }
			);

			onSave( newPage );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created post e.g: "Hello world".
					__( '"%s" successfully created.' ),
					decodeEntities( newPage.title?.rendered || title )
				),
				{ type: 'snackbar' }
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
			setIsCreatingPost( false );
		}
	}

	return (
		<Modal
			title={
				// translators: %s: post type singular_name label e.g: "Page".
				sprintf( __( 'Draft new: %s' ), labels?.singular_name )
			}
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form onSubmit={ createPost }>
				<VStack spacing={ 4 }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title' ) }
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
							isBusy={ isCreatingPost }
							aria-disabled={ isCreatingPost }
						>
							{ __( 'Create draft' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
