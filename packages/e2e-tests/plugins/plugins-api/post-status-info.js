( function () {
	const el = wp.element.createElement;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginPostStatusInfo = wp.editor.PluginPostStatusInfo;

	function MyPostStatusInfoPlugin() {
		return el(
			PluginPostStatusInfo,
			{
				className: 'my-post-status-info-plugin',
			},
			__( 'My post status info' )
		);
	}

	registerPlugin( 'my-post-status-info-plugin', {
		render: MyPostStatusInfoPlugin,
	} );
} )();
