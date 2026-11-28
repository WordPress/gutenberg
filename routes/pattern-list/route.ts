import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Route configuration for pattern list.
 */
export const route = {
	async beforeLoad() {
		// The content reads the editor's globals as soon as it loads.
		const { loadEditorAssets } = await import( '@wordpress/lazy-editor' );
		await loadEditorAssets();
	},
	title: () => __( 'Patterns' ),
	loader: async () => {
		// Preload the view configuration the stage resolves its view from.
		await unlock( resolveSelect( coreStore ) ).getViewConfig(
			'postType',
			'wp_block'
		);
	},
};
