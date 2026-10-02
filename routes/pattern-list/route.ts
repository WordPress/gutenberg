import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { loadFields } from '@wordpress/fields-loader';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Route configuration for pattern list.
 */
export const route = {
	title: () => __( 'Patterns' ),
	loader: async () => {
		await Promise.all( [
			// Preload the view configuration the stage resolves its view from.
			unlock( resolveSelect( coreStore ) ).getViewConfig(
				'postType',
				'wp_block'
			),
			// Warm up the fields the stage renders. `useFields` there shares
			// this resolution, so the screen paints with its fields on first
			// render. A failure is the stage's to report, so it does not
			// block the route.
			loadFields( { kind: 'postType', name: 'wp_block' } ).catch(
				() => {}
			),
		] );
	},
};
