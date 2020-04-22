( function() {
	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;

	function MyDocumentSettingPlugin() {
		return el(
			PluginDocumentSettingPanel,
			{
				className: 'my-document-setting-plugin',
				title: 'My Custom Panel'
			},
			__( 'My Document Setting Panel' )
		);
	}

	registerPlugin( 'my-document-setting-plugin', {
		render: MyDocumentSettingPlugin
	} );
} )();
