( function( element, editPost, plugins ) {
	function fillBlockSettingsMenuSlot() {
		return element.createElement(
			editPost.PluginBlockSettingsMenuItem,
			{
				icon: 'screenoptions',
				label: 'My new plugin',
				allowedBlocks: [ 'core/paragraph' ],
				onClick: function() {
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
