import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * The stage only renders a form, so it requests the `form` of the entity view
 * configuration alone. Must match the fields the stage requests so both resolve
 * under the same cache key.
 */
const VIEW_CONFIG_FIELDS = 'form';

/**
 * Route configuration for the site identity.
 */
export const route = {
	title: () => _x( 'Identity', 'site identity' ),
	async canvas() {
		return {
			isPreview: true,
			// This route shows the site, so it shows the template around
			// whatever the canvas resolves to, including a static front page.
			renderingMode: 'template-locked' as const,
		};
	},
	loader: async () => {
		await Promise.all( [
			// The stage renders a form over the site settings, so preload them
			// before the surface mounts.
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
			// Preload the form configuration the stage renders.
			unlock( resolveSelect( coreStore ) ).getViewConfig(
				'root',
				'site',
				{
					fields: VIEW_CONFIG_FIELDS,
				}
			),
		] );
	},
};
