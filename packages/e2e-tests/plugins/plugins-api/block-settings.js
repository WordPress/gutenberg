( function( element, editPost, plugins ) {
	function fillBlockSettingsMenuSlot() {
		return element.createElement(
			editPost.PluginBlockSettingsMenuItem,
			{
				icon: 'screenoptions',
				label: 'My new plugin',
				allowedBlocks: [ 'core/list' ],
				onClick() {
					// eslint-disable-next-line no-console
					console.log( 'Block clicked' );
				},
			},
			null
		);
	}
	plugins.registerPlugin( 'block-settings-menu-plugin', {
		render: fillBlockSettingsMenuSlot,
	} );
} )( window.wp.element, window.wp.editPost, window.wp.plugins );
