( function () {
	const { useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { createElement: el } = wp.element;

	wp.blocks.registerBlockType( 'test/container-without-paragraph', {
		apiVersion: 3,
		title: 'Container without paragraph',
		category: 'text',
		icon: 'yes',

		edit: function Edit() {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				allowedBlocks: [ 'core/image', 'core/gallery' ],
			} );
			return el( 'div', innerBlocksProps );
		},

		save() {
			return wp.element.createElement(
				wp.blockEditor.InnerBlocks.Content
			);
		},
	} );
} )();
