/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { CheckboxControl, Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

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

	const [ unsavedEntityRecords, _setUnsavedEntityRecords ] = useState( [] );
	const setUnsavedEntityRecords = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setUnsavedEntityRecords(
				unsavedEntityRecords.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setUnsavedEntityRecords( [
				...unsavedEntityRecords,
				{ kind, name, key },
			] );
		}
	};
	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { key, kind, name } ) => {
				return ! some(
					ignoredForSave.concat( unsavedEntityRecords ),
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		entitiesToSave.forEach( ( { key, kind, name } ) => {
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
				{ dirtyEntityRecords.map( ( record ) => {
					return (
						<CheckboxControl
							key={ record.key }
							label={
								<>
									{ record.entity.label }
									{ !! record.title && (
										<>
											{ ': ' }
											<strong>
												{ record.title ||
													__( 'Untitled' ) }
											</strong>
										</>
									) }
								</>
							}
							checked={
								! some(
									unsavedEntityRecords,
									( elt ) =>
										elt.kind === record.kind &&
										elt.name === record.name &&
										elt.key === record.key
								)
							}
							onChange={ ( value ) =>
								setUnsavedEntityRecords( record, value )
							}
						/>
					);
				} ) }

				<Button
					isPrimary
					disabled={
						dirtyEntityRecords.length -
							unsavedEntityRecords.length ===
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
