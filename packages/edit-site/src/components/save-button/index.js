/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EntitiesSavedStates } from '@wordpress/editor';

export default function SaveButton() {
	const [ , setStatus ] = useEntityProp(
		'postType',
		'wp_template',
		'status'
	);
	// Publish template if not done yet.
	useEffect( () => setStatus( 'publish' ), [] );

	const { isDirty, isSaving } = useSelect( ( select ) => {
		const { getEntityRecordChangesByRecord, isSavingEntityRecord } = select(
			'core'
		);
		const entityRecordChangesByRecord = getEntityRecordChangesByRecord();
		const changedKinds = Object.keys( entityRecordChangesByRecord );
		return {
			isDirty: changedKinds.length > 0,
			isSaving: changedKinds.some( ( changedKind ) =>
				Object.keys(
					entityRecordChangesByRecord[ changedKind ]
				).some( ( changedName ) =>
					Object.keys(
						entityRecordChangesByRecord[ changedKind ][
							changedName
						]
					).some( ( changedKey ) =>
						isSavingEntityRecord(
							changedKind,
							changedName,
							changedKey
						)
					)
				)
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
				{ __( 'Update' ) }
			</Button>
			<EntitiesSavedStates isOpen={ isOpen } onRequestClose={ close } />
		</>
	);
}
