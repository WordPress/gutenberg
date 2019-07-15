( function() {
	wp.blocks.registerBlockType('test/container-without-paragraph', {
		title: 'Container without paragraph',
		category: 'common',
		icon: 'yes',

		edit() {
			return wp.element.createElement(wp.blockEditor.InnerBlocks, {
				allowedBlocks: ['core/image', 'core/gallery']
			});
		},

		save() {
			return wp.element.createElement(wp.blockEditor.InnerBlocks.Content);
		},
	})
} )();
