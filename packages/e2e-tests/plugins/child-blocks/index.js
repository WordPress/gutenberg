( function () {
	const { InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { createElement: el } = wp.element;
	const { registerBlockType } = wp.blocks;

	registerBlockType( 'test/child-blocks-unrestricted-parent', {
		apiVersion: 3,
		title: 'Child Blocks Unrestricted Parent',
		icon: 'carrot',
		category: 'text',

		edit: function Edit() {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps );
			return el( 'div', innerBlocksProps );
		},

		save() {
			return el( 'div', {}, el( InnerBlocks.Content ) );
		},
	} );

	registerBlockType( 'test/child-blocks-restricted-parent', {
		apiVersion: 3,
		title: 'Child Blocks Restricted Parent',
		icon: 'carrot',
		category: 'text',

		edit: function Edit() {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				allowedBlocks: [ 'core/paragraph', 'core/image' ],
			} );
			return el( 'div', innerBlocksProps );
		},

		save() {
			return el( 'div', {}, el( InnerBlocks.Content ) );
		},
	} );

	registerBlockType( 'test/child-blocks-child', {
		apiVersion: 3,
		title: 'Child Blocks Child',
		icon: 'carrot',
		category: 'text',

		parent: [
			'test/child-blocks-unrestricted-parent',
			'test/child-blocks-restricted-parent',
		],

		edit: function Edit() {
			const blockProps = useBlockProps();
			return el( 'div', blockProps, 'Child' );
		},

		save() {
			return el( 'div', {}, 'Child' );
		},
	} );
} )();
