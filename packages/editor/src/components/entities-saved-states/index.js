/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, CheckboxControl, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';

const EntitiesSavedStatesCheckbox = ( {
	id,
	name,
	changes: { rawRecord },
	checked,
	setCheckedById,
} ) => (
	<CheckboxControl
		label={ `${ startCase( name ) }: "${ rawRecord.title || rawRecord.name }"` }
		checked={ checked }
		onChange={ useCallback( ( nextChecked ) => setCheckedById( id, nextChecked ), [ id ] ) }
	/>
);

export default function EntitiesSavedStates( { isOpen, onRequestClose } ) {
	const entityRecordChangesByRecord = useSelect( ( select ) =>
		select( 'core' ).getEntityRecordChangesByRecord()
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const [ checkedById, _setCheckedById ] = useState( {} );
	const setCheckedById = useCallback(
		( id, checked ) =>
			_setCheckedById( ( prevCheckedById ) => {
				const nextCheckedById = {
					...prevCheckedById,
				};
				if ( checked ) {
					nextCheckedById[ id ] = true;
				} else {
					delete nextCheckedById[ id ];
				}
				return nextCheckedById;
			} ),
		[]
	);
	const saveCheckedEntities = useCallback( () => {
		Object.keys( checkedById ).forEach( ( id ) =>
			saveEditedEntityRecord( ...id.split( ' | ' ).filter( ( s ) => s !== 'undefined' ) )
		);
		onRequestClose( checkedById );
	}, [ checkedById ] );
	return (
		isOpen && (
			<Modal
				title="What do you want to save?"
				onRequestClose={ onRequestClose }
				contentLabel="Select items to save."
			>
				{ Object.keys( entityRecordChangesByRecord ).map( ( changedKind ) =>
					Object.keys( entityRecordChangesByRecord[ changedKind ] ).map(
						( changedName ) =>
							Object.keys(
								entityRecordChangesByRecord[ changedKind ][ changedName ]
							).map( ( changedKey ) => {
								const id = `${ changedKind } | ${ changedName } | ${ changedKey }`;
								return (
									<EntitiesSavedStatesCheckbox
										key={ id }
										id={ id }
										name={ changedName }
										changes={
											entityRecordChangesByRecord[ changedKind ][ changedName ][
												changedKey
											]
										}
										checked={ checkedById[ id ] }
										setCheckedById={ setCheckedById }
									/>
								);
							} )
					)
				) }
				<Button
					isPrimary
					disabled={ Object.keys( checkedById ).length === 0 }
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					Save
				</Button>
			</Modal>
		)
	);
}
