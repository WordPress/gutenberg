( function () {
	wp.blocks.registerBlockType( 'test/container-without-paragraph', {
		apiVersion: 3,
		title: 'Container without paragraph',
		category: 'text',
		icon: 'yes',

		edit() {
			return wp.element.createElement( wp.blockEditor.InnerBlocks, {
				allowedBlocks: [ 'core/image', 'core/gallery' ],
			} );
		},

		save() {
			return wp.element.createElement(
				wp.blockEditor.InnerBlocks.Content
			);
		},
	} );
} )();
