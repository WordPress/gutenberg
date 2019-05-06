( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var createBlock = wp.blocks.createBlock;
	var el = wp.element.createElement;
	var InnerBlocks = wp.editor.InnerBlocks;
	var __ = wp.i18n.__;
	var TEMPLATE = [
		[ 'core/paragraph', {
			fontSize: 'large',
			content: 'Content…',
		} ],
	];

	var TEMPLATE_PARAGRAPH_PLACEHOLDER = [
		[ 'core/paragraph', {
			fontSize: 'large',
			placeholder: 'Content…',
		} ],
	];

	var save = function() {
		return el( InnerBlocks.Content );
	};

	registerBlockType( 'test/test-inner-blocks-no-locking', {
		title: 'Test Inner Blocks no locking',
		icon: 'cart',
		category: 'common',

		edit: function( props ) {
			return el(
				InnerBlocks,
				{
					template: TEMPLATE,
				}
			);
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-locking-all', {
		title: 'Test InnerBlocks locking all',
		icon: 'cart',
		category: 'common',

		edit: function( props ) {
			return el(
				InnerBlocks,
				{
					template: TEMPLATE,
					templateLock: 'all',
				}
			);
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-paragraph-placeholder', {
		title: 'Test Inner Blocks Paragraph Placeholder',
		icon: 'cart',
		category: 'common',

		edit: function( props ) {
			return el(
				InnerBlocks,
				{
					template: TEMPLATE_PARAGRAPH_PLACEHOLDER,
				}
			);
		},

		save,
	} );

	registerBlockType( 'test/test-inner-blocks-transformer-target', {
		title: 'Test Inner Blocks transformer target',
		icon: 'cart',
		category: 'common',

		transforms: {
			from: [
				{
					type: 'block',
					blocks: [
						'test/i-dont-exist',
						'test/test-inner-blocks-no-locking',
						'test/test-inner-blocks-locking-all',
						'test/test-inner-blocks-paragraph-placeholder'
					],
					transform: function( attributes, innerBlocks ) {
						return createBlock( 'test/test-inner-blocks-transformer-target', attributes, innerBlocks );
					},
				},
			],
			to: [
				{
					type: 'block',
					blocks: [ 'test/i-dont-exist' ],
					transform: function( attributes, innerBlocks ) {
						return createBlock( 'test/test-inner-blocks-transformer-target', attributes, innerBlocks );
					},
				}
			]
		},

		edit: function( props ) {
			return el(
				InnerBlocks,
				{
					template: TEMPLATE,
				}
			);
		},

		save,
	} );

} )();
