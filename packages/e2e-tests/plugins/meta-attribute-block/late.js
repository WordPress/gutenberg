( function () {
	const registerBlockType = wp.blocks.registerBlockType;
	const el = wp.element.createElement;

	registerBlockType( 'test/test-meta-attribute-block-late', {
		title: 'Test Meta Attribute Block (Late Registration)',
		icon: 'star',
		category: 'text',

		attributes: {
			content: {
				type: 'string',
				source: 'meta',
				meta: 'my_meta',
			},
		},

		edit( props ) {
			return el( 'input', {
				className: 'my-meta-input',
				value: props.attributes.content,
				onChange( event ) {
					props.setAttributes( { content: event.target.value } );
				},
			} );
		},

		save() {
			return null;
		},
	} );
} )();
