/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, withFocusReturn } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import { close as closeIcon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';

const TRANSLATED_SITE_PROTPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	sitelogo: __( 'Logo' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

function EntitiesSavedStates( { isOpen, close } ) {
	const saveButtonRef = useRef();
	useEffect( () => {
		if ( isOpen ) {
			// Focus the save button when the saved states panel is opened
			saveButtonRef.current?.focus();
		}
	}, [ isOpen ] );
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		const dirtyRecords = select(
			coreStore
		).__experimentalGetDirtyEntityRecords();

		// Remove site object and decouple into its edited pieces.
		const dirtyRecordsWithoutSite = dirtyRecords.filter(
			( record ) => ! ( record.kind === 'root' && record.name === 'site' )
		);

		const siteEdits = select( coreStore ).getEntityRecordEdits(
			'root',
			'site'
		);

		const siteEditsAsEntities = [];
		for ( const property in siteEdits ) {
			siteEditsAsEntities.push( {
				kind: 'root',
				name: 'site',
				title: TRANSLATED_SITE_PROTPERTIES[ property ] || property,
				property,
			} );
		}
		const dirtyRecordsWithSiteItems = [
			...dirtyRecordsWithoutSite,
			...siteEditsAsEntities,
		];

		return {
			dirtyEntityRecords: dirtyRecordsWithSiteItems,
		};
	}, [] );
	const {
		saveEditedEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( dirtyEntityRecords, 'name' )
	);

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = (
		{ kind, name, key, property },
		checked
	) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key ||
						elt.property !== property
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key, property },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key, property } ) => {
				return ! some(
					unselectedEntities,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key &&
						elt.property === property
				);
			}
		);

		close( entitiesToSave );

		const siteItemsToSave = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToSave.push( property );
			} else {
				saveEditedEntityRecord( kind, name, key );
			}
		} );
		saveSpecifiedEntityEdits( 'root', 'site', undefined, siteItemsToSave );
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	return isOpen ? (
		<div className="entities-saved-states__panel">
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
				<Button
					onClick={ dismissPanel }
					icon={ closeIcon }
					label={ __( 'Close panel' ) }
				/>
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
	) : null;
}

export default withFocusReturn( EntitiesSavedStates );
