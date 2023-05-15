/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { check } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';
import { unlock } from '../../private-apis';

const { useLocation } = unlock( routerPrivateApis );

const PUBLISH_ON_SAVE_ENTITIES = [
	{
		kind: 'postType',
		name: 'wp_navigation',
	},
];

export default function SaveHub() {
	const { params } = useLocation();

	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const { dirtyRecords, countUnsavedChanges, isDirty, isSaving } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				isSavingEntityRecord,
			} = select( coreStore );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();

			return {
				dirtyRecords: dirtyEntityRecords,
				isDirty: dirtyEntityRecords.length > 0,
				isSaving: dirtyEntityRecords.some( ( record ) =>
					isSavingEntityRecord( record.kind, record.name, record.key )
				),
				countUnsavedChanges: dirtyEntityRecords.length,
			};
		},
		[]
	);

	const {
		editEntityRecord,
		saveEditedEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const disabled = isSaving || ( ! isDirty && ! isPreviewingTheme() );

	// if we have only one unsaved change and it matches current context, we can show a more specific label
	let dirtyLocal = null;

	if ( countUnsavedChanges === 1 ) {
		// if we are on global styles
		if ( params.path?.includes( 'wp_global_styles' ) ) {
			dirtyLocal = dirtyRecords.find(
				( record ) => record.name === 'globalStyles'
			);
		}
		// if we are on pages
		else if ( !! params.postType ) {
			dirtyLocal = dirtyRecords.find(
				( record ) =>
					record.name === params.postType &&
					String( record.key ) === params.postId
			);
		}
	}

	let label = dirtyLocal
		? __( 'Save' )
		: sprintf(
				// translators: %d: number of unsaved changes (number).
				_n(
					'Review %d change…',
					'Review %d changes…',
					countUnsavedChanges
				),
				countUnsavedChanges
		  );

	if ( isSaving ) {
		label = __( 'Saving' );
	}

	const saveCurrentEntity = async () => {
		if ( ! dirtyLocal ) return;

		const { kind, name, key, property } = dirtyLocal;

		try {
			if ( 'root' === dirtyLocal.kind && 'site' === name ) {
				await saveSpecifiedEntityEdits( 'root', 'site', undefined, [
					property,
				] );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					editEntityRecord( kind, name, key, { status: 'publish' } );
				}

				await saveEditedEntityRecord( kind, name, key );
			}

			__unstableMarkLastChangeAsPersistent();

			createSuccessNotice( __( 'Site updated.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			createErrorNotice( `${ __( 'Saving failed.' ) } ${ error }` );
		}
	};

	return (
		<HStack className="edit-site-save-hub" alignment="right" spacing={ 4 }>
			{ dirtyLocal ? (
				<Button
					variant="primary"
					onClick={ saveCurrentEntity }
					isBusy={ isSaving }
					disabled={ isSaving }
					aria-disabled={ isSaving }
					className="edit-site-save-hub__button"
				>
					{ label }
				</Button>
			) : (
				<SaveButton
					className="edit-site-save-hub__button"
					variant={ disabled ? null : 'primary' }
					showTooltip={ false }
					icon={ disabled && ! isSaving ? check : null }
					defaultLabel={ label }
				/>
			) }
		</HStack>
	);
}
