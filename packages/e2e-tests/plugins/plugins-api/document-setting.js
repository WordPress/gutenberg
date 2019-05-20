( function() {
	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginDocumentSetting = wp.editPost.PluginDocumentSetting;

	function MyDocumentSettingPlugin() {
		return el(
			PluginDocumentSetting,
			{
				className: 'my-document-setting-plugin',
			},
			__( 'My Document Setting Panel' )
		);
	}

	registerPlugin( 'my-document-setting-plugin', {
		render: MyDocumentSettingPlugin
	} );
} )();
