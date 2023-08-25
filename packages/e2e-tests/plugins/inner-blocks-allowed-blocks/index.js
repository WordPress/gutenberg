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
	const allowedBlocksWhenTwoChildren = [ 'core/gallery', 'core/video' ];
    const allowedBlocksWhenTreeOrMoreChildren = [ 'core/gallery', 'core/video', 'core/list'  ];

	registerBlockType( 'test/allowed-blocks-dynamic', {
		apiVersion: 3,
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
            let allowedBlocks = allowedBlocksWhenSingleEmptyChild;
            if ( props.numberOfChildren === 2 ) {
                allowedBlocks = allowedBlocksWhenTwoChildren;
            } else if( props.numberOfChildren > 2 ){
                allowedBlocks = allowedBlocksWhenTreeOrMoreChildren;
            }
			return el(
				'div',
				{
					...divProps,
					'data-number-of-children': numberOfChildren,
				},
				el( InnerBlocks, {
					allowedBlocks,
				} )
			);
		},
		save() {
			return el( 'div', divProps, el( InnerBlocks.Content ) );
		}
	} );
} )();
