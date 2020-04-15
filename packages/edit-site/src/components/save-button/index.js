/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useEditorContext } from '../editor';

export default function SaveButton() {
	const { settings } = useEditorContext();
	const [ , setStatus ] = useEntityProp(
		'postType',
		settings.templateType,
		'status'
	);
	const [ , setTitle ] = useEntityProp(
		'postType',
		settings.templateType,
		'title'
	);
	const [ slug ] = useEntityProp( 'postType', settings.templateType, 'slug' );
	// Publish template if not done yet.
	useEffect( () => {
		setStatus( 'publish' );
		setTitle( slug );
	}, [ slug ] );

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

	const { openEntitiesSavedStates: openSavePanel } = useDispatch(
		'core/edit-site'
	);
	const openPanel = useCallback( () => openSavePanel(), [] );

	return (
		<>
			<Button
				isPrimary
				className="edit-site-save-button__button"
				aria-disabled={ disabled }
				disabled={ disabled }
				isBusy={ isSaving }
				onClick={ disabled ? undefined : openPanel }
			>
				{ __( 'Update Design' ) }
			</Button>
		</>
	);
}
