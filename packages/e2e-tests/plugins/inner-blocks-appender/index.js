( function () {
	const { wp } = window;
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { InnerBlocks } = wp.blockEditor;
	const { useSelect } = wp.data;

	const allowedBlocks = [ 'core/quote', 'core/video' ];

	function MyCustomAppender() {
		return el(
			'div',
			{ className: 'my-custom-awesome-appender' },
			el( 'span', {}, 'My custom awesome appender' ),
			el( InnerBlocks.ButtonBlockAppender )
		);
	}

	function EmptyBlockAppender() {
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

	function SingleBlockAppender() {
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

	function MultipleBlockAppender() {
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

	registerBlockType( 'test/inner-blocks-appender', {
		title: 'InnerBlocks appender',
		icon: 'carrot',
		category: 'text',

		edit() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks, {
					allowedBlocks,
					appender: el( MyCustomAppender ),
				} )
			);
		},

		save() {
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );

	registerBlockType( 'test/inner-blocks-appender-dynamic', {
		title: 'InnerBlocks appender dynamic',
		icon: 'carrot',
		category: 'text',

		edit( props ) {
			// Disable reason: this is a react component, but the rule of hook
			// fails because the block's edit function has a lowercase 'e'.
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const numberOfChildren = useSelect(
				( select ) => {
					const { getBlockOrder } = select( 'core/block-editor' );
					return getBlockOrder( props.clientId ).length;
				},
				[ props.clientId ]
			);
			let appender;
			switch ( numberOfChildren ) {
				case 0:
					appender = el( EmptyBlockAppender );
					break;
				case 1:
					appender = el( SingleBlockAppender );
					break;
				default:
					appender = el( MultipleBlockAppender );
					break;
			}
			return el(
				'div',
				{ style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks, {
					allowedBlocks,
					appender,
				} )
			);
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
