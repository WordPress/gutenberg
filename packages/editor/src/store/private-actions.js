/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

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
	};
