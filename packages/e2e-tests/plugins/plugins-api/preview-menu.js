( function () {
	const { __ } = wp.i18n;
	const { registerPlugin } = wp.plugins;
	const PluginPreviewMenuItem = wp.editor.PluginPreviewMenuItem;
	const el = wp.element.createElement;

	function CustomPreviewMenuItem() {
		return el( PluginPreviewMenuItem, {}, __( 'Custom Preview' ) );
	}

	registerPlugin( 'custom-preview-menu-item', {
		render: CustomPreviewMenuItem,
	} );
} )();
