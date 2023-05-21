/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __experimentalHStack as HStack } from '@wordpress/components';
import { sprintf, _n } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

export default function SaveHub() {
	const { countUnsavedChanges, isDirty, isSaving } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				isSavingEntityRecord,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			return {
				isDirty: dirtyEntityRecords.length > 0,
				isSaving: dirtyEntityRecords.some( ( record ) =>
					isSavingEntityRecord( record.kind, record.name, record.key )
				),
				countUnsavedChanges: dirtyEntityRecords.length,
			};
		},
		[]
	);

	const disabled = isSaving || ( ! isDirty && ! isPreviewingTheme() );

	return (
		<HStack className="edit-site-save-hub" alignment="right" spacing={ 4 }>
			{ isDirty && (
				<span>
					{ sprintf(
						// translators: %d: number of unsaved changes (number).
						_n(
							'%d unsaved change',
							'%d unsaved changes',
							countUnsavedChanges
						),
						countUnsavedChanges
					) }
				</span>
			) }
			<SaveButton
				className="edit-site-save-hub__button"
				variant={ disabled ? null : 'primary' }
				showTooltip={ false }
				icon={ disabled ? check : null }
			/>
		</HStack>
	);
}
