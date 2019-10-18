/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { Button, Modal, CheckboxControl } from '@wordpress/components';

const EntitiesSavedStatesCheckbox = ( {
	id,
	name,
	changes: { rawRecord, edits },
	checked,
	setCheckedById,
} ) => (
	<CheckboxControl
		label={ `${ startCase( name ) }: "${ rawRecord.title || rawRecord.name }"` }
		help={ `Changed Properties: ${ Object.keys( edits ).join( ', ' ) }.` }
		checked={ checked }
		onChange={ useCallback( ( nextChecked ) => setCheckedById( id, nextChecked ), [ id ] ) }
	/>
);

export default function EntitiesSavedStates() {
	const entityRecordChangesByRecord = useSelect( ( select ) =>
		select( 'core' ).getEntityRecordChangesByRecord()
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const [ isOpen, setIsOpen ] = useState( false );
	const [ checkedById, _setCheckedById ] = useState( {} );

	const openModal = useCallback( setIsOpen.bind( null, true ), [] );
	const closeModal = useCallback( setIsOpen.bind( null, false ), [] );
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
		closeModal();
		Object.keys( checkedById ).forEach( ( id ) =>
			saveEditedEntityRecord( ...id.split( ' | ' ) )
		);
	}, [ checkedById ] );

	const changedKinds = Object.keys( entityRecordChangesByRecord );
	return (
		changedKinds.length > 0 && (
			<>
				<Button isSmall onClick={ openModal }>
					Save Global Changes
				</Button>
				{ isOpen && (
					<Modal
						title="What do you want to save?"
						onRequestClose={ closeModal }
						contentLabel="Select items to save."
					>
						{ changedKinds.map( ( changedKind ) =>
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
				) }
			</>
		)
	);
}
