( function() {
	var wp = window.wp;
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;
	var InnerBlocks = wp.blockEditor.InnerBlocks;
	var withSelect = wp.data.withSelect;

	var dataSelector = withSelect( function( select, ownProps ) {
		var getBlockOrder = select( 'core/block-editor' ).getBlockOrder;
		return {
			numberOfChildren: getBlockOrder( ownProps.clientId ).length,
		};
	} );
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

	registerBlockType( 'test/inner-blocks-renderappender', {
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

	registerBlockType( 'test/inner-blocks-renderappender-dynamic', {
		title: 'InnerBlocks renderAppender dynamic',
		icon: 'carrot',
		category: 'common',

		edit: dataSelector( function( props ) {
			var renderAppender;
			switch ( props.numberOfChildren ) {
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
		} ),

		save() {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				el( InnerBlocks.Content )
			);
		},
	} );
}() );
