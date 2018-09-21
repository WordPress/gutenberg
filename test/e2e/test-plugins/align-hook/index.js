( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;
	var InnerBlocks = wp.editor.InnerBlocks;
	var __ = wp.i18n.__;
	var TEMPLATE = [
		[ 'core/paragraph', { fontSize: 'large', content: 'Content…' } ],
	];

	var baseBlock = {
		icon: 'cart',
		category: 'common',
		edit: function( props ) {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				'Test Align Hook'
			);
		},
		save: function() {
			return el( 'div', { style: { outline: '1px solid gray', padding: 5 } },
				'Test Align Hook'
			);
		},
	};

	registerBlockType( 'test/test-no-alignment-set', {
		title: 'Test No Alignment Set',
		icon: baseBlock.icon,
		category: baseBlock.category,
		edit: baseBlock.edit,
		save: baseBlock.save,
	} );

	registerBlockType( 'test/test-align-true', {
		title: 'Test Align True',
		icon: baseBlock.icon,
		category: baseBlock.category,
		edit: baseBlock.edit,
		save: baseBlock.save,
		supports: {
			align: true,
		}
	} );

	registerBlockType( 'test/test-align-array', {
		title: 'Test Align Array',
		icon: baseBlock.icon,
		category: baseBlock.category,
		edit: baseBlock.edit,
		save: baseBlock.save,
		supports: {
			align: [ 'left', 'center' ],
		}
	} );

	registerBlockType( 'test/test-default-align', {
		title: 'Test Default Align',
		icon: baseBlock.icon,
		category: baseBlock.category,
		edit: baseBlock.edit,
		save: baseBlock.save,
		attributes: {
			align: {
				type: 'string',
				default: 'right',
			},
		},
		supports: {
			align: true,
		}
	} );
} )();
