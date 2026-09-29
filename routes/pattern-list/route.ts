import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';
import { loadEntityFields } from '@wordpress/entity-fields';

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
			// Warm up the fields the stage renders. A failure is reported by the stage.
			loadEntityFields( { kind: 'postType', name: 'wp_block' } ).catch(
				() => {}
			),
		] );
	},
};
