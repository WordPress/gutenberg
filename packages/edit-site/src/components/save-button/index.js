/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EntitiesSavedStates } from '@wordpress/editor';

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

	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( setIsOpen.bind( null, true ), [] );
	const close = useCallback( setIsOpen.bind( null, false ), [] );
	return (
		<>
			<Button
				isPrimary
				aria-disabled={ disabled }
				disabled={ disabled }
				isBusy={ isSaving }
				onClick={ disabled ? undefined : open }
			>
				{ __( 'Update Design' ) }
			</Button>
			<EntitiesSavedStates isOpen={ isOpen } onRequestClose={ close } />
		</>
	);
}
