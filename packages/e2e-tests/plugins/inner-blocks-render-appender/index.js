( function () {
	const { wp } = window;
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;

	const allowedBlocks = [ 'core/quote', 'core/video' ];

	function myCustomAppender() {
		return el(
			'div',
			{ className: 'my-custom-awesome-appender' },
			el( 'span', {}, 'My custom awesome appender' ),
			el( InnerBlocks.ButtonBlockAppender )
		);
	}

	function emptyBlockAppender() {
		return el(
			'div',
			{ className: 'my-dynamic-blocks-appender' },
			el(
				'span',
				{ className: 'empty-blocks-appender' },
				'Empty Blocks Appender'
			),
			el( InnerBlocks.ButtonBlockAppender )
		);
	}

	function singleBlockAppender() {
		return el(
			'div',
			{ className: 'my-dynamic-blocks-appender' },
			el(
				'span',
				{ className: 'single-blocks-appender' },
				'Single Blocks Appender'
			),
			el( InnerBlocks.ButtonBlockAppender )
		);
	}

	function multipleBlockAppender() {
		return el(
			'div',
			{ className: 'my-dynamic-blocks-appender' },
			el(
				'span',
				{ className: 'multiple-blocks-appender' },
				'Multiple Blocks Appender'
			)
		);
	}

	registerBlockType( 'test/inner-blocks-render-appender', {
		apiVersion: 3,
		title: 'InnerBlocks renderAppender',
		icon: 'carrot',
		category: 'text',

		edit: function Edit() {
			const blockProps = useBlockProps( {
				style: { outline: '1px solid gray', padding: 5 },
			} );
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				allowedBlocks,
				renderAppender: myCustomAppender,
			} );
			return el( 'div', innerBlocksProps );
		},

		save() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );

	registerBlockType( 'test/inner-blocks-render-appender-dynamic', {
		apiVersion: 3,
		title: 'InnerBlocks renderAppender dynamic',
		icon: 'carrot',
		category: 'text',

		edit: function Edit( props ) {
			const blockProps = useBlockProps( {
				style: { outline: '1px solid gray', padding: 5 },
			} );
			const numberOfChildren = useSelect(
				( select ) => {
					const { getBlockOrder } = select( 'core/block-editor' );
					return getBlockOrder( props.clientId ).length;
				},
				[ props.clientId ]
			);
			let renderAppender;
			switch ( numberOfChildren ) {
				case 0:
					renderAppender = emptyBlockAppender;
					break;
				case 1:
					renderAppender = singleBlockAppender;
					break;
				default:
					renderAppender = multipleBlockAppender;
					break;
			}
			const innerBlocksProps = useInnerBlocksProps( blockProps, {
				allowedBlocks,
				renderAppender,
			} );
			return el( 'div', innerBlocksProps );
		},

		save() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );
} )();
