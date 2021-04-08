/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SaveButton( { openEntitiesSavedStates } ) {
	const { isDirty, isSaving } = useSelect( ( select ) => {
		const {
			__experimentalGetDirtyEntityRecords,
			isSavingEntityRecord,
		} = select( 'core' );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: some( dirtyEntityRecords, ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
		};
	} );

	const disabled = ! isDirty || isSaving;

	return (
		<>
			<Button
				isPrimary
				className="edit-site-save-button__button"
				aria-disabled={ disabled }
				disabled={ disabled }
				isBusy={ isSaving }
				onClick={ disabled ? undefined : openEntitiesSavedStates }
			>
				{ __( 'Save' ) }
			</Button>
		</>
	);
}
