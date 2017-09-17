( () => {
	const { createElement: el } = wp.element;
	const { registerBlockType } = wp.blocks;

	registerBlockType( 'gutenberg-demo/book', {
		title: 'Book',

		icon: 'book',

		category: 'common',

		attributes: {
			author: {
				type: 'string',
				meta: 'author',
			},
		},

		edit: function( props ) {
			function onChange( event ) {
				props.setAttributes( { author: event.target.value } );
			}

			return el( 'input', {
				value: props.attributes.author,
				onChange: onChange,
			} );
		},

		save: function( /* props */ ) {
			return null;
		},
	} );
} )();
