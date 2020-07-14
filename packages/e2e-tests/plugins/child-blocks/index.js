( function() {
	const { InnerBlocks } = wp.blockEditor;
	const { createElement: el } = wp.element;
	const { registerBlockType } = wp.blocks;

	registerBlockType( 'test/child-blocks-unrestricted-parent', {
		title: 'Child Blocks Unrestricted Parent',
		icon: 'carrot',
		category: 'text',

		edit() {
			return el(
				'div',
				{},
				el( InnerBlocks )
			);
		},

		save() {
			return el(
				'div',
				{},
				el( InnerBlocks.Content )
			);
		},
	} );

	registerBlockType( 'test/child-blocks-restricted-parent', {
		title: 'Child Blocks Restricted Parent',
		icon: 'carrot',
		category: 'text',

		edit() {
			return el(
				'div',
				{},
				el(
					InnerBlocks,
					{ allowedBlocks: [ 'core/paragraph', 'core/image' ] }
				)
			);
		},

		save() {
			return el(
				'div',
				{},
				el( InnerBlocks.Content )
			);
		},
	} );

	registerBlockType( 'test/child-blocks-child', {
		title: 'Child Blocks Child',
		icon: 'carrot',
		category: 'text',

		parent: [
			'test/child-blocks-unrestricted-parent',
			'test/child-blocks-restricted-parent',
		],

		edit() {
			return el(
				'div',
				{},
				'Child'
			);
		},

		save() {
			return el(
				'div',
				{},
				'Child'
			);
		},
	} );
} )();
