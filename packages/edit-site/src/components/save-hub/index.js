/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { sprintf, __, _n } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { displayShortcut } from '@wordpress/keycodes';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function SaveButton() {
	const { countUnsavedChanges, isDirty, isSaving, isSaveViewOpen } =
		useSelect( ( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				isSavingEntityRecord,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			const { isSaveViewOpened } = select( editSiteStore );
			return {
				isDirty: dirtyEntityRecords.length > 0,
				isSaving: dirtyEntityRecords.some( ( record ) =>
					isSavingEntityRecord( record.kind, record.name, record.key )
				),
				isSaveViewOpen: isSaveViewOpened(),
				countUnsavedChanges: dirtyEntityRecords.length,
			};
		}, [] );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

	const disabled = ! isDirty || isSaving;

	const label = disabled ? __( 'Saved' ) : __( 'Save' );

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
			<Button
				className="edit-site-save-hub__button"
				variant={ disabled ? undefined : 'primary' }
				aria-disabled={ disabled }
				aria-expanded={ isSaveViewOpen }
				isBusy={ isSaving }
				onClick={
					disabled ? undefined : () => setIsSaveViewOpened( true )
				}
				label={ label }
				/*
				 * We want the tooltip to show the keyboard shortcut only when the
				 * button does something, i.e. when it's not disabled.
				 */
				shortcut={
					disabled ? undefined : displayShortcut.primary( 's' )
				}
				icon={ disabled ? check : undefined }
			>
				{ label }
			</Button>
		</HStack>
	);
}
