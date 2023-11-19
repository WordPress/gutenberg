wp.blocks.registerBlockType( 'my-plugin/hooked-block', {
	edit: ( props ) => {
		return wp.element.createElement(
			'small',
			{},
			props.attributes.content
		);
	},
} );
