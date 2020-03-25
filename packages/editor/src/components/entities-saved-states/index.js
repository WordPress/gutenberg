/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { CheckboxControl, Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

function EntityRecordState( { record, checked, onChange } ) {
	return (
		<CheckboxControl
			label={
				<>
					{ !! record.title && (
						<strong>{ record.title || __( 'Untitled' ) }</strong>
					) }
				</>
			}
			checked={ checked }
			onChange={ onChange }
		/>
	);
}

function EntityTypeList( { list, ignored, setIgnored } ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( 'core' ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	return (
		<>
			<h2>{ entity.label }</h2>
			{ list.map( ( record ) => {
				return (
					<EntityRecordState
						key={ record.key }
						record={ record }
						checked={
							! some(
								ignored,
								( elt ) =>
									elt.kind === record.kind &&
									elt.name === record.name &&
									elt.key === record.key
							)
						}
						onChange={ ( value ) => setIgnored( record, value ) }
					/>
				);
			} ) }
		</>
	);
}

export default function EntitiesSavedStates( {
	isOpen,
	onRequestClose,
	ignoredForSave = [],
} ) {
	const dirtyEntityRecords = useSelect(
		( select ) => select( 'core' ).__experimentalGetDirtyEntityRecords(),
		[]
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	// Entities savable by save function.
	const savableEntityRecords = dirtyEntityRecords.filter(
		( { kind, name, key } ) => {
			return ! some(
				ignoredForSave,
				( elt ) =>
					elt.kind === kind && elt.name === name && elt.key === key
			);
		}
	);

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( savableEntityRecords, 'name' )
	);

	// Unchecked entities to be ignored by save function.
	const [ entityRecordsToIgnore, _setEntityRecordsToIgnore ] = useState( [] );

	const setEntityRecordsToIgnore = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setEntityRecordsToIgnore(
				entityRecordsToIgnore.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setEntityRecordsToIgnore( [
				...entityRecordsToIgnore,
				{ kind, name, key },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = savableEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					entityRecordsToIgnore,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );

		onRequestClose( entitiesToSave );
	};

	return (
		isOpen && (
			<Modal
				title={ __( 'What do you want to save?' ) }
				onRequestClose={ () => onRequestClose() }
				contentLabel={ __( 'Select items to save.' ) }
			>
				{ partitionedSavables.map( ( list ) => {
					return (
						<EntityTypeList
							key={ list[ 0 ].name }
							list={ list }
							ignored={ entityRecordsToIgnore }
							setIgnored={ setEntityRecordsToIgnore }
						/>
					);
				} ) }

				<Button
					isPrimary
					disabled={
						savableEntityRecords.length -
							entityRecordsToIgnore.length ===
						0
					}
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					{ __( 'Save' ) }
				</Button>
			</Modal>
		)
	);
}
