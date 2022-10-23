( function () {
	const el = wp.element.createElement;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;

	function MyDocumentSettingPlugin() {
		return el(
			PluginDocumentSettingPanel,
			{
				className: 'my-document-setting-plugin',
				title: 'My Custom Panel',
				name: 'my-custom-panel',
			},
			__( 'My Document Setting Panel' )
		);
	}

	registerPlugin( 'my-document-setting-plugin', {
		render: MyDocumentSettingPlugin,
	} );
} )();
