/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment, useState, useCallback, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { close as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';
import EntityRecordItem from './entity-record-item';

const TRANSLATED_SITE_PROPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	site_logo: __( 'Logo' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

const PUBLISH_ON_SAVE_ENTITIES = [
	{
		kind: 'postType',
		name: 'wp_navigation',
	},
];

export default function EntitiesSavedStates( { close } ) {
	const saveButtonRef = useRef();
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
				title: TRANSLATED_SITE_PROPERTIES[ property ] || property,
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
		editEntityRecord,
		saveEditedEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
		__experimentalResetEditedEntityRecord: resetEditedEntityRecord,
		__experimentalResetSpecifiedEntityEdits: resetSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	// To group entities by type.
	const partitionedSavables = groupBy( dirtyEntityRecords, 'name' );

	// Sort entity groups.
	const {
		site: siteSavables,
		wp_template: templateSavables,
		wp_template_part: templatePartSavables,
		...contentSavables
	} = partitionedSavables;
	const sortedPartitionedSavables = [
		siteSavables,
		templateSavables,
		templatePartSavables,
		...Object.values( contentSavables ),
	].filter( Array.isArray );

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	// Discard entities?
	const [ discardEntitiesPanel, showDiscardEntitiesPanel ] = useState(
		false
	);

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

		if ( entitiesToSave.length === dirtyEntityRecords.length ) {
			// We're saving all changes and can thus safely return to the editor afterwards.
			showDiscardEntitiesPanel( false );
			close( entitiesToSave );
		} else {
			showDiscardEntitiesPanel( true );
		}

		const siteItemsToSave = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToSave.push( property );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					editEntityRecord( kind, name, key, { status: 'publish' } );
				}

				saveEditedEntityRecord( kind, name, key );
			}
		} );
		if ( siteItemsToSave.length ) {
			saveSpecifiedEntityEdits(
				'root',
				'site',
				undefined,
				siteItemsToSave
			);
		}
	};

	const discardCheckedEntities = () => {
		const entitiesToDiscard = dirtyEntityRecords.filter(
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

		const siteItemsToDiscard = [];
		entitiesToDiscard.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToDiscard.push( property );
			} else {
				// if (
				// 	PUBLISH_ON_SAVE_ENTITIES.some(
				// 		( typeToPublish ) =>
				// 			typeToPublish.kind === kind &&
				// 			typeToPublish.name === name
				// 	)
				// ) {
				// 	editEntityRecord( kind, name, key, { status: 'publish' } );
				// }

				resetEditedEntityRecord( kind, name, key );
			}
		} );
		resetSpecifiedEntityEdits(
			'root',
			'site',
			undefined,
			siteItemsToDiscard
		);
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	const [ saveDialogRef, saveDialogProps ] = useDialog( {
		onClose: () => dismissPanel(),
	} );

	const SaveEntitiesPanel = () => (
		<Fragment>
			<div className="entities-saved-states__text-prompt">
				<strong>{ __( 'Are you ready to save?' ) }</strong>
				<p>
					{ __(
						'The following changes have been made to your site, templates, and content.'
					) }
				</p>
			</div>

			{ sortedPartitionedSavables.map( ( list ) => {
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
		</Fragment>
	);

	const DiscardEntitiesPanel = () => (
		<Fragment>
			<div className="entities-saved-states__discard-changes-panel">
				<div className="entities-saved-states__text-prompt">
					<strong>{ __( "What's next?" ) }</strong>
					<p>
						{ __(
							'Your template still has some unsaved changes.'
						) }
					</p>
					<p>
						{ __(
							'You can select them and discard their changes, or continue editing and deal with them later.'
						) }
					</p>
				</div>

				<PanelBody initialOpen={ true }>
					{ sortedPartitionedSavables.flat().map( ( record ) => {
						return (
							<EntityRecordItem
								key={ record.key || record.property }
								record={ record }
								checked={
									! some(
										unselectedEntities,
										( elt ) =>
											elt.kind === record.kind &&
											elt.name === record.name &&
											elt.key === record.key &&
											elt.property === record.property
									)
								}
								onChange={ ( value ) =>
									setUnselectedEntities( record, value )
								}
								//closePanel={ closePanel }
							/>
						);
					} ) }
					<PanelRow>
						<Button
							disabled={
								dirtyEntityRecords.length -
									unselectedEntities.length ===
								0
							}
							isDestructive
							onClick={ discardCheckedEntities }
						>
							{ __( 'Discard changes' ) }
						</Button>
					</PanelRow>
				</PanelBody>
			</div>

			<div className="entities-saved-states__footer">
				<Button variant="primary">
					<span>{ __( 'Continue editing' ) }</span>
				</Button>
			</div>
		</Fragment>
	);

	return (
		<div
			ref={ saveDialogRef }
			{ ...saveDialogProps }
			className="entities-saved-states__panel"
		>
			<div className="entities-saved-states__panel-header">
				{ discardEntitiesPanel ? null : (
					<Button
						ref={ saveButtonRef }
						variant="primary"
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
				) }
				<Button
					icon={ closeIcon }
					onClick={ dismissPanel }
					label={ __( 'Close panel' ) }
				/>
			</div>
			{ discardEntitiesPanel ? (
				<DiscardEntitiesPanel />
			) : (
				<SaveEntitiesPanel />
			) }
		</div>
	);
}
