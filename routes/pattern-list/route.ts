import { __ } from '@wordpress/i18n';
import { loadPatternViewConfig } from './view-utils';

/**
 * Route configuration for pattern list.
 */
export const route = {
	title: () => __( 'Patterns' ),
	loader: async () => {
		// Preload the view configuration the stage resolves its view from.
		await loadPatternViewConfig();
	},
};
