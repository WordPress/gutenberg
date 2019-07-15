( function() {
	wp.blocks.registerBlockType( 'test/alternative-group-block', {
		title: 'Alternative Group Block',
		category: 'layout',
		icon: 'yes',
		edit() {
			return wp.element.createElement( wp.blockEditor.InnerBlocks );
		},

		save() {
			return wp.element.createElement( wp.blockEditor.InnerBlocks.Content );
		},
		transforms: {
			from: [ {
				type: 'block',
				blocks: [ '*' ],
				isMultiBlock: true,
				__experimentalConvert( blocks ) {
					const groupInnerBlocks = blocks.map( ( { name, attributes, innerBlocks } ) => {
						return wp.blocks.createBlock( name, attributes, innerBlocks );
					} );

					return wp.blocks.createBlock( 'test/alternative-group-block', {}, groupInnerBlocks );
				},
			} ],
		},
	} );
}() );
