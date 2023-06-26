( function () {
	const { useSelect } = wp.data;
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks } = wp.blockEditor;
	const divProps = {
		className: 'product',
		style: { outline: '1px solid gray', padding: 5 },
	};

	const allowedBlocksWhenSingleEmptyChild = [ 'core/image', 'core/list' ];
	const allowedBlocksWhenMultipleChildren = [ 'core/gallery', 'core/video' ];

	registerBlockType( 'test/allowed-blocks-dynamic', {
		title: 'Allowed Blocks Dynamic',
		icon: 'carrot',
		category: 'text',

		edit: function Edit( props ) {
			const numberOfChildren = useSelect(
				( select ) => {
					const { getBlockCount } = select( 'core/block-editor' );
					return getBlockCount( props.clientId );
				},
				[ props.clientId ]
			);

			return el(
				'div',
				{
					...divProps,
					'data-number-of-children': numberOfChildren,
				},
				el( InnerBlocks, {
					allowedBlocks:
						numberOfChildren < 2
							? allowedBlocksWhenSingleEmptyChild
							: allowedBlocksWhenMultipleChildren,
				} )
			);
		},
		save() {
			return el( 'div', divProps, el( InnerBlocks.Content ) );
		}
	} );
} )();
