/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useImageEditing } from '@wordpress/media-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Save button for attachment editing that handles both entity edits and image cropping.
 * Enables the save button when either the entity has been edited OR the cropper is dirty.
 *
 * Based on the ciab-admin implementation.
 *
 * @return {Element} The save button component
 */
export default function AttachmentSaveButton() {
	const [ isProcessing, setIsProcessing ] = useState( false );
	const {
		postId,
		hasEntityEdits,
		isSaving,
		media,
		onNavigateToEntityRecord,
	} = useSelect( ( select ) => {
		const { getCurrentPostId, isEditedPostDirty, isSavingPost } =
			select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { getSettings } = select( blockEditorStore );

		const id = getCurrentPostId();
		return {
			postId: id,
			hasEntityEdits: isEditedPostDirty(),
			isSaving: isSavingPost(),
			media: getEditedEntityRecord( 'postType', 'attachment', id ),
			onNavigateToEntityRecord: getSettings().onNavigateToEntityRecord,
		};
	}, [] );

	const { isDirty: isCropperDirty, getModifiers, reset } = useImageEditing();

	const { savePost } = useDispatch( editorStore );
	const { editMediaEntity } = unlock( useDispatch( coreStore ) );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleSave = useCallback( async () => {
		setIsProcessing( true );

		try {
			// If cropper is dirty, get modifiers and use editMediaEntity
			if ( isCropperDirty && media?.source_url ) {
				const modifiers = getModifiers();

				if ( modifiers.length > 0 ) {
					// Call editMediaEntity with modifiers
					const response = await editMediaEntity(
						postId,
						{
							src: media.source_url,
							modifiers,
						},
						{ throwOnError: true }
					);

					if ( response && response.id ) {
						// editMediaEntity returns a NEW attachment with a new ID
						// Navigate to edit the new attachment without a full page reload
						if ( onNavigateToEntityRecord ) {
							onNavigateToEntityRecord( {
								postId: response.id,
								postType: 'attachment',
							} );
						}

						// Reset the cropper to clean state
						reset();

						createSuccessNotice( __( 'Media saved' ), {
							type: 'snackbar',
							id: 'attachment-save-success',
						} );
					}
				}
			} else if ( hasEntityEdits ) {
				// If only entity has edits (no cropper changes), use standard save
				await savePost();

				createSuccessNotice( __( 'Media saved' ), {
					type: 'snackbar',
					id: 'attachment-save-success',
				} );
			}
		} catch ( error ) {
			createErrorNotice(
				__( 'Could not save attachment. Please try again.' ),
				{
					type: 'snackbar',
					id: 'attachment-save-error',
				}
			);
			// eslint-disable-next-line no-console
			console.error( 'Error saving attachment:', error );
		} finally {
			setIsProcessing( false );
		}
	}, [
		isCropperDirty,
		hasEntityEdits,
		media,
		postId,
		getModifiers,
		reset,
		editMediaEntity,
		onNavigateToEntityRecord,
		savePost,
		createSuccessNotice,
		createErrorNotice,
	] );

	// Button is enabled if entity has edits OR cropper is dirty
	const isDisabled =
		isSaving || isProcessing || ( ! hasEntityEdits && ! isCropperDirty );

	return (
		<Button
			variant="primary"
			size="compact"
			onClick={ handleSave }
			disabled={ isDisabled }
			isBusy={ isSaving || isProcessing }
			accessibleWhenDisabled
			__experimentalIsFocusable
		>
			{ __( 'Save' ) }
		</Button>
	);
}
