/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Returns an action object used to set which template is currently being used/edited.
 *
 * @param {string} id Template Id.
 *
 * @return {Object} Action object.
 */
export function setCurrentTemplateId( id ) {
	return {
		type: 'SET_CURRENT_TEMPLATE_ID',
		id,
	};
}

/**
 * Create a block based template.
 *
 * @param {Object?} template Template to create and assign.
 */
export const createTemplate =
	( template ) =>
	async ( { select, dispatch, registry } ) => {
		const savedTemplate = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_template', template );
		registry
			.dispatch( coreStore )
			.editEntityRecord(
				'postType',
				select.getCurrentPostType(),
				select.getCurrentPostId(),
				{
					template: savedTemplate.slug,
				}
			);
		registry
			.dispatch( noticesStore )
			.createSuccessNotice(
				__( "Custom template created. You're in template mode now." ),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Go back' ),
							onClick: () =>
								dispatch.setRenderingMode(
									select.getEditorSettings()
										.defaultRenderingMode
								),
						},
					],
				}
			);
		return savedTemplate;
	};

/**
 * Update the provided block types to be visible.
 *
 * @param {string[]} blockNames Names of block types to show.
 */
export const showBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const newBlockNames = existingBlockNames.filter(
			( type ) =>
				! (
					Array.isArray( blockNames ) ? blockNames : [ blockNames ]
				).includes( type )
		);

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', newBlockNames );
	};

/**
 * Update the provided block types to be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 */
export const hideBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const mergedBlockNames = new Set( [
			...existingBlockNames,
			...( Array.isArray( blockNames ) ? blockNames : [ blockNames ] ),
		] );

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', [ ...mergedBlockNames ] );
	};

/**
 * Save entity records marked as dirty.
 *
 * @param {Object}   options                      Options for the action.
 * @param {Function} [options.onSave]             Callback when saving happens.
 * @param {object[]} [options.dirtyEntityRecords] Array of dirty entities.
 * @param {object[]} [options.entitiesToSkip]     Array of entities to skip saving.
 * @param {Function} [options.close]              Callback when the actions is called. It should be consolidated with `onSave`.
 */
export const saveDirtyEntities =
	( { onSave, dirtyEntityRecords = [], entitiesToSkip = [], close } = {} ) =>
	( { registry } ) => {
		const PUBLISH_ON_SAVE_ENTITIES = [
			{ kind: 'postType', name: 'wp_navigation' },
		];
		const saveNoticeId = 'site-editor-save-success';
		const homeUrl = registry.select( coreStore ).getUnstableBase()?.home;
		registry.dispatch( noticesStore ).removeNotice( saveNoticeId );
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key, property } ) => {
				return ! entitiesToSkip.some(
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key &&
						elt.property === property
				);
			}
		);
		close?.( entitiesToSave );
		const siteItemsToSave = [];
		const pendingSavedRecords = [];
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
					registry
						.dispatch( coreStore )
						.editEntityRecord( kind, name, key, {
							status: 'publish',
						} );
				}

				pendingSavedRecords.push(
					registry
						.dispatch( coreStore )
						.saveEditedEntityRecord( kind, name, key )
				);
			}
		} );
		if ( siteItemsToSave.length ) {
			pendingSavedRecords.push(
				registry
					.dispatch( coreStore )
					.__experimentalSaveSpecifiedEntityEdits(
						'root',
						'site',
						undefined,
						siteItemsToSave
					)
			);
		}
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();
		Promise.all( pendingSavedRecords )
			.then( ( values ) => {
				return onSave ? onSave( values ) : values;
			} )
			.then( ( values ) => {
				if (
					values.some( ( value ) => typeof value === 'undefined' )
				) {
					registry
						.dispatch( noticesStore )
						.createErrorNotice( __( 'Saving failed.' ) );
				} else {
					registry
						.dispatch( noticesStore )
						.createSuccessNotice( __( 'Site updated.' ), {
							type: 'snackbar',
							id: saveNoticeId,
							actions: [
								{
									label: __( 'View site' ),
									url: homeUrl,
								},
							],
						} );
				}
			} )
			.catch( ( error ) =>
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						`${ __( 'Saving failed.' ) } ${ error }`
					)
			);
	};
