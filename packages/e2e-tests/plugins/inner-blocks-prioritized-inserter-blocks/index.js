( function () {
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks } = wp.blockEditor;
	const __ = wp.i18n.__;

    const divProps = {
		className: 'product',
		style: { outline: '1px solid gray', padding: 5 },
	};

    // Make it easier to select the block.
	const template = [
		[ 'core/image' ],
    ];

	const save = function () {
		return el( 'div', divProps, el( InnerBlocks.Content ) );
	};
	registerBlockType( 'test/prioritized-inserter-blocks-unset', {
		title: 'Prioritized Inserter Blocks Unset',
		icon: 'carrot',
		category: 'text',

		edit() {
			return el( 'div', divProps, el( InnerBlocks, { template } ) );
		},

		save,
	} );

	registerBlockType( 'test/prioritized-inserter-blocks-set', {
		title: 'Prioritized Inserter Blocks Set',
		icon: 'carrot',
		category: 'text',
		edit() {
			return el(
				'div',
				divProps,
				el( InnerBlocks, {
                    template,
					prioritizedInserterBlocks: [
                        'core/audio',
						'core/spacer',
                        'core/code',
					],
				} )
			);
		},

		save,
	} );

	// registerBlockType( 'test/prioritized-inserter-blocks-dynamic', {
	// 	title: 'Allowed Blocks Dynamic',
	// 	icon: 'carrot',
	// 	category: 'text',

	// 	edit: withSelect( function ( select, ownProps ) {
	// 		const getBlockOrder = select( 'core/block-editor' ).getBlockOrder;
	// 		return {
	// 			numberOfChildren: getBlockOrder( ownProps.clientId ).length,
	// 		};
	// 	} )( function ( props ) {
	// 		return el(
	// 			'div',
	// 			{
	// 				...divProps,
	// 				'data-number-of-children': props.numberOfChildren,
	// 			},
	// 			el( InnerBlocks, {
	// 				allowedBlocks:
	// 					props.numberOfChildren < 2
	// 						? allowedBlocksWhenSingleEmptyChild
	// 						: allowedBlocksWhenMultipleChildren,
	// 			} )
	// 		);
	// 	} ),

	// 	save,
	// } );
} )();
