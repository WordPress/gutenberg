( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;
	var InnerBlocks = wp.blockEditor.InnerBlocks;
	var __ = wp.i18n.__;
	var TEMPLATE = [
		[ 'core/paragraph', {
			fontSize: 'large',
			content: __( 'Content…' ),
		} ],
		[ 'core/embed' ],
	];

	var save = function() {
		return el( InnerBlocks.Content );
	};

	registerBlockType( 'test/test-inner-blocks-locking-all-embed', {
		title: 'Test Inner Blocks Locking All Embed',
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
} )();
