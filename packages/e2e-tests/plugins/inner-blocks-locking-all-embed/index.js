( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const InnerBlocks = wp.blockEditor.InnerBlocks;
	const __ = wp.i18n.__;
	const TEMPLATE = [
		[
			'core/paragraph',
			{
				fontSize: 'large',
				content: __( 'Content…' ),
			},
		],
		[ 'core/embed' ],
	];

	const save = function () {
		return el( InnerBlocks.Content );
	};

	registerBlockType( 'test/test-inner-blocks-locking-all-embed', {
		title: 'Test Inner Blocks Locking All Embed',
		icon: 'cart',
		category: 'text',

		edit() {
			return el( InnerBlocks, {
				template: TEMPLATE,
				templateLock: 'all',
			} );
		},

		save,
	} );
} )();
