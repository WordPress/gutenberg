import { __ } from '@wordpress/i18n';

export const route = {
	async beforeLoad() {
		// The content reads the editor's globals as soon as it loads.
		const { loadEditorAssets } = await import( '@wordpress/lazy-editor' );
		await loadEditorAssets();
	},
	title: () => __( 'Fonts' ),
};
