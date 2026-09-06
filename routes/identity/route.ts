import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';

/**
 * Route configuration for the site identity.
 */
export const route = {
	title: () => _x( 'Identity', 'site identity' ),
	async canvas() {
		return {
			isPreview: true,
		};
	},
	loader: async () => {
		// The stage renders a form over the site settings, so preload them
		// before the surface mounts.
		await resolveSelect( coreStore ).getEntityRecord( 'root', 'site' );
	},
};
