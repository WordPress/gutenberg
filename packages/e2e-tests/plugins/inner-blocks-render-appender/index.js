( function() {
	const { wp } = window;
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks } = wp.blockEditor;
	const { useSelect } = wp.data;

	var allowedBlocks = [ 'core/quote', 'core/video' ];

	function myCustomAppender() {
		return (
			el( 'div', { className: 'my-custom-awesome-appender' },
				el( 'span', {}, 'My custom awesome appender' ),
				el( InnerBlocks.ButtonBlockAppender )
			)
		);
	}

	function emptyBlockAppender() {
		return (
			el( 'div', { className: 'my-dynamic-blocks-appender' },
				el( 'span', { className: 'empty-blocks-appender' }, 'Empty Blocks Appender' ),
				el( InnerBlocks.ButtonBlockAppender )
			)
		);
	}

	function singleBlockAppender() {
		return (
			el( 'div', { className: 'my-dynamic-blocks-appender' },
				el( 'span', { className: 'single-blocks-appender' }, 'Single Blocks Appender' ),
				el( InnerBlocks.ButtonBlockAppender )
			)
		);
	}

	function multipleBlockAppender() {
		return (
			el( 'div', { className: 'my-dynamic-blocks-appender' },
				el( 'span', { className: 'multiple-blocks-appender' }, 'Multiple Blocks Appender' ),
			)
		);
	}

	registerBlockType( 'test/inner-blocks-render-appender', {
		title: 'InnerBlocks renderAppender',
		icon: 'carrot',
		category: 'common',

		edit() {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks, {
					allowedBlocks: allowedBlocks,
					renderAppender: myCustomAppender,
				} )
			);
		},

		save() {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );

	registerBlockType( 'test/inner-blocks-render-appender-dynamic', {
		title: 'InnerBlocks renderAppender dynamic',
		icon: 'carrot',
		category: 'common',

		edit( props ) {
			const numberOfChildren = useSelect( ( select ) => {
				const { getBlockOrder } = select( 'core/block-editor' );
				return getBlockOrder( props.clientId ).length;
			}, [ props.clientId ] );
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
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks, {
					allowedBlocks,
					renderAppender,
				} )
			);
		},

		save() {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );
}() );
