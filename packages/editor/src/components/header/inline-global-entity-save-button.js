/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check, cloudUpload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

export default function InlineGlobalEntitySaveButton( { activeEntity } ) {
	const { postType, postId } = activeEntity;
	const { hasEdits, isSaving } = useSelect(
		( select ) => {
			const core = select( coreStore );
			return {
				hasEdits: core.hasEditsForEntityRecord(
					'postType',
					postType,
					postId
				),
				isSaving: core.isSavingEntityRecord(
					'postType',
					postType,
					postId
				),
			};
		},
		[ postType, postId ]
	);
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const saveEntity = async () => {
		try {
			await saveEditedEntityRecord( 'postType', postType, postId );
			createSuccessNotice( __( 'Changes saved.' ), {
				type: 'snackbar',
			} );
		} catch {
			createErrorNotice( __( 'Could not save changes.' ), {
				type: 'snackbar',
			} );
		}
	};

	const isDisabled = isSaving || ! hasEdits;
	let label = __( 'Saved' );
	if ( isSaving ) {
		label = __( 'Saving' );
	} else if ( hasEdits ) {
		label = __( 'Save' );
	}

	return (
		<Button
			variant={ hasEdits ? 'primary' : 'tertiary' }
			size="compact"
			icon={ hasEdits ? cloudUpload : check }
			disabled={ isDisabled }
			accessibleWhenDisabled
			onClick={ isDisabled ? undefined : saveEntity }
		>
			{ label }
		</Button>
	);
}
