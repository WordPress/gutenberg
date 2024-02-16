/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
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
