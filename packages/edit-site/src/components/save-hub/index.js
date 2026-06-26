/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Stack } from '@wordpress/ui';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

export default function SaveHub() {
	const { isDisabled, isSaving } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const _isSaving = dirtyEntityRecords.some( ( record ) =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);
		return {
			isSaving: _isSaving,
			isDisabled:
				_isSaving ||
				( ! dirtyEntityRecords.length && ! isPreviewingTheme() ),
		};
	}, [] );
	return (
		<Stack className="edit-site-save-hub" gap="lg">
			<SaveButton
				className="edit-site-save-hub__button"
				variant={ isDisabled && ! isSaving ? null : 'primary' }
				showTooltip={ false }
				icon={ isDisabled && ! isSaving ? check : null }
				showReviewMessage
				__next40pxDefaultSize
			/>
		</Stack>
	);
}
