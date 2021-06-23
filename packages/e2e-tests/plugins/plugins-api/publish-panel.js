( function () {
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginPostPublishPanel = wp.editPost.PluginPostPublishPanel;
	const PluginPrePublishPanel = wp.editPost.PluginPrePublishPanel;

	function PanelContent() {
		return el( 'p', {}, __( 'Here is the panel content!' ) );
	}

	function MyPublishPanelPlugin() {
		return el(
			Fragment,
			{},
			el(
				PluginPrePublishPanel,
				{
					className: 'my-publish-panel-plugin__pre',
					title: __( 'My pre publish panel' ),
				},
				el( PanelContent, {} )
			),
			el(
				PluginPostPublishPanel,
				{
					className: 'my-publish-panel-plugin__post',
					title: __( 'My post publish panel' ),
				},
				el( PanelContent, {} )
			)
		);
	}

	registerPlugin( 'my-publish-panel-plugin', {
		render: MyPublishPanelPlugin,
	} );
} )();
