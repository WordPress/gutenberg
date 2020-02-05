/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import { CheckboxControl, Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

const EntitiesSavedStatesCheckbox = ( {
	id,
	name,
	changes: { rawRecord },
	checked,
	setCheckedById,
} ) => (
	<CheckboxControl
		label={ `${ name }: "${ rawRecord.name ||
			rawRecord.slug ||
			rawRecord.title ||
			__( 'Untitled' ) }"` }
		checked={ checked }
		onChange={ ( nextChecked ) => setCheckedById( id, nextChecked ) }
	/>
);

export default function EntitiesSavedStates( {
	isOpen,
	onRequestClose,
	ignoredForSave = new EquivalentKeyMap(),
} ) {
	const entityRecordChangesByRecord = useSelect( ( select ) =>
		select( 'core' ).getEntityRecordChangesByRecord()
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const [ checkedById, _setCheckedById ] = useState(
		() => new EquivalentKeyMap()
	);
	const setCheckedById = ( id, checked ) =>
		_setCheckedById( ( prevCheckedById ) => {
			const nextCheckedById = new EquivalentKeyMap( prevCheckedById );
			if ( checked ) {
				nextCheckedById.set( id, true );
			} else {
				nextCheckedById.delete( id );
			}
			return nextCheckedById;
		} );
	const saveCheckedEntities = () => {
		checkedById.forEach( ( _checked, id ) => {
			if ( ! ignoredForSave.has( id ) ) {
				saveEditedEntityRecord(
					...id.filter(
						( s, i ) => i !== id.length - 1 || s !== 'undefined'
					)
				);
			}
		} );
		onRequestClose( checkedById );
	};
	return (
		isOpen && (
			<Modal
				title={ __( 'What do you want to save?' ) }
				onRequestClose={ () => onRequestClose() }
				contentLabel={ __( 'Select items to save.' ) }
			>
				{ Object.keys( entityRecordChangesByRecord ).map(
					( changedKind ) =>
						Object.keys(
							entityRecordChangesByRecord[ changedKind ]
						).map( ( changedName ) =>
							Object.keys(
								entityRecordChangesByRecord[ changedKind ][
									changedName
								]
							).map( ( changedKey ) => {
								const id = [
									changedKind,
									changedName,
									changedKey,
								];
								return (
									<EntitiesSavedStatesCheckbox
										key={ id.join( ' | ' ) }
										id={ id }
										name={ changedName }
										changes={
											entityRecordChangesByRecord[
												changedKind
											][ changedName ][ changedKey ]
										}
										checked={ checkedById.get( id ) }
										setCheckedById={ setCheckedById }
									/>
								);
							} )
						)
				) }
				<Button
					isPrimary
					disabled={ checkedById.size === 0 }
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					{ __( 'Save' ) }
				</Button>
			</Modal>
		)
	);
}
