( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;
	const { InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
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
		apiVersion: 3,
		title: 'Test Inner Blocks Locking All Embed',
		icon: 'cart',
		category: 'text',

		edit: function Edit() {
			const blockProps = useBlockProps();
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				template: TEMPLATE,
				templateLock: 'all',
			} );
			return el( 'div', innerBlocksProps );
		},

		save,
	} );
} )();
