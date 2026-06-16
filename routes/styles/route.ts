/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { resolveIsStylesRouteSupported } from './utils';

/**
 * Route configuration for styles.
 */
export const route = {
	title: () => __( 'Styles' ),
	async canvas( context: any ) {
		if ( ! ( await resolveIsStylesRouteSupported() ) ) {
			return undefined;
		}
		// If stylebook preview is active, use custom canvas (StyleBookPreview)
		// Otherwise, use default editor canvas
		if ( context.search.preview === 'stylebook' ) {
			return null;
		}
		return {
			isPreview: true,
		};
	},
};
