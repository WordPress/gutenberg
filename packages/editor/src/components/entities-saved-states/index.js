/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	CheckboxControl,
	Button,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	close,
	more,
	page,
	layout,
	grid,
	blockDefault,
} from '@wordpress/icons';

function EntityRecordState( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;
	const { blocks, getParent } = useSelect( ( select ) => {
		const editedEntity = select( 'core' ).getEditedEntityRecord(
			kind,
			name,
			key
		);
		return {
			blocks: editedEntity.blocks || [],
			getParent: select( 'core/block-editor' ).getBlockParents,
		};
	} );

	const { selectBlock } = useDispatch( 'core/block-editor' );

	const parents = getParent( blocks[ 0 ]?.clientId );

	const selectBlocks = () => {
		selectBlock( parents[ parents.length - 1 ] );
	};

	return (
		<PanelRow>
			<CheckboxControl
				label={ <strong>{ title || __( 'Untitled' ) }</strong> }
				checked={ checked }
				onChange={ onChange }
			/>
			{ parents.length ? (
				<Button onClick={ selectBlocks }>{ __( 'Who am I?' ) }</Button>
			) : null }
		</PanelRow>
	);
}

function EntityTypeList( { list, unselectedEntities, setUnselectedEntities } ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( 'core' ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	// Set icon based on firstRecord.name.
	const { name } = firstRecord;
	let icon = more;
	if ( name === 'site' ) {
		icon = layout;
	} else if ( name === 'page' ) {
		icon = page;
	} else if ( name === 'post' || name === 'wp_template' ) {
		icon = grid;
	} else if ( name === 'wp_template_part' ) {
		icon = blockDefault;
	}

	return (
		<PanelBody
			title={ entity.label }
			initialOpen={ true }
			icon={ icon }
			// className="editor-entities-saved-states__entity-type-list"
		>
			{ /* <h2>{ entity.label }</h2> */ }
			{ list.map( ( record ) => {
				return (
					<EntityRecordState
						key={ record.key || 'site' }
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
		</PanelBody>
	);
}

export default function EntitiesSavedStates() {
	const dirtyEntityRecords = useSelect(
		( select ) => select( 'core' ).__experimentalGetDirtyEntityRecords(),
		[]
	);
	const isOpen = useSelect( ( select ) =>
		select( 'core/editor' ).isEntitiesSavedStatesOpen()
	);
	const { saveEditedEntityRecord } = useDispatch( 'core' );
	const { closeEntitiesSavedStatesPanel: closePanel } = useDispatch(
		'core/editor'
	);

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

		closePanel( entitiesToSave );
	};

	return isOpen ? (
		<div className="entities-saved-states__panel">
			<div className="entities-saved-states__panel-header">
				<Button
					onClick={ () => closePanel() }
					icon={ close }
					label={ __( 'Close panel' ) }
				/>
			</div>

			<div className="entities-saved-states__text-prompt">
				<h2>
					{ __( 'Please review the following changes to save:' ) }
				</h2>
			</div>

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
					dirtyEntityRecords.length - unselectedEntities.length === 0
				}
				onClick={ saveCheckedEntities }
				className="editor-entities-saved-states__save-button"
			>
				{ __( 'Save selected items' ) }
			</Button>
		</div>
	) : null;
}
