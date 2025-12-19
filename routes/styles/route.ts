/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Route configuration for styles.
 */
export const route = {
	title: () => __( 'Styles' ),
	async canvas( context: any ) {
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
