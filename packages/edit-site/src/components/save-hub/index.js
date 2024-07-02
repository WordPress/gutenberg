/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __experimentalHStack as HStack } from '@wordpress/components';
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
		<HStack className="edit-site-save-hub" alignment="right" spacing={ 4 }>
			<SaveButton
				className="edit-site-save-hub__button"
				variant={ isDisabled ? null : 'primary' }
				showTooltip={ false }
				icon={ isDisabled && ! isSaving ? check : null }
				showReviewMessage
				__next40pxDefaultSize
			/>
		</HStack>
	);
}
