/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';

export default function EntitiesSavedStates( { close } ) {
	const saveButtonRef = useRef();
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		return {
			dirtyEntityRecords: select(
				coreStore
			).__experimentalGetDirtyEntityRecords(),
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( coreStore );

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

		close( entitiesToSave );

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	const [ saveDialogRef, saveDialogProps ] = useDialog( {
		onClose: () => dismissPanel(),
	} );

	return (
		<div
			ref={ saveDialogRef }
			{ ...saveDialogProps }
			className="entities-saved-states__panel"
		>
			<div className="entities-saved-states__panel-header">
				<Button
					ref={ saveButtonRef }
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
				<Button icon={ close } onClick={ dismissPanel } />
			</div>

			<div className="entities-saved-states__text-prompt">
				<strong>{ __( 'Select the changes you want to save' ) }</strong>
				<p>
					{ __(
						'Some changes may affect other areas of your site.'
					) }
				</p>
			</div>

			{ partitionedSavables.map( ( list ) => {
				return (
					<EntityTypeList
						key={ list[ 0 ].name }
						list={ list }
						closePanel={ dismissPanel }
						unselectedEntities={ unselectedEntities }
						setUnselectedEntities={ setUnselectedEntities }
					/>
				);
			} ) }
		</div>
	);
}
