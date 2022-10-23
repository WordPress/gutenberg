/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function SaveButton() {
	const { isDirty, isSaving, isSaveViewOpen } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const { isSaveViewOpened } = select( editSiteStore );
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: some( dirtyEntityRecords, ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			isSaveViewOpen: isSaveViewOpened(),
		};
	}, [] );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

	const disabled = ! isDirty || isSaving;

	return (
		<Button
			variant="primary"
			className="edit-site-save-button__button"
			aria-disabled={ disabled }
			aria-expanded={ isSaveViewOpen }
			isBusy={ isSaving }
			onClick={ disabled ? undefined : () => setIsSaveViewOpened( true ) }
		>
			{ __( 'Save' ) }
		</Button>
	);
}
