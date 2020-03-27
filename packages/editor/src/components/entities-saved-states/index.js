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
			label={ <strong>{ record.title || __( 'Untitled' ) }</strong> }
			checked={ checked }
			onChange={ onChange }
		/>
	);
}

function EntityTypeList( { list, unselectedEntities, setUnselectedEntities } ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( 'core' ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	return (
		<>
			<h3>{ entity.label }</h3>
			{ list.map( ( record ) => {
				return (
					<EntityRecordState
						key={ record.key }
						record={ record }
						checked={
							! some(
								unselectedEntities,
								( elt ) =>
									elt.kind === record.kind &&
									elt.name === record.name &&
									elt.key === record.key
							)
						}
						onChange={ ( value ) =>
							setUnselectedEntities( record, value )
						}
					/>
				);
			} ) }
		</>
	);
}

export default function EntitiesSavedStates( { isOpen, onRequestClose } ) {
	const dirtyEntityRecords = useSelect(
		( select ) => select( 'core' ).__experimentalGetDirtyEntityRecords(),
		[]
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( dirtyEntityRecords, 'name' )
	);

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					unselectedEntities,
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
							unselectedEntities={ unselectedEntities }
							setUnselectedEntities={ setUnselectedEntities }
						/>
					);
				} ) }

				<Button
					isPrimary
					disabled={
						dirtyEntityRecords.length -
							unselectedEntities.length ===
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
