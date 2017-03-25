const { query, html, text } = wp.blocks.query;

wp.blocks.registerBlock( 'wp/quote', {
	title: 'Quote',
	icon: 'quote',

	attributes: {
		value: query( 'blockquote', html( 'p' ) ),
		citation: query( 'cite,footer', text() )
	},

	edit( attributes, onChange ) {
		return wp.element.createElement( wp.blocks.EditableQuote, {
			value: attributes.value,
			citation: attributes.citation,
			onChange: ( value ) => onChange( { value } )
		} );
	},

	save( attributes ) {
		return wp.element.createElement( 'p', null, attributes.value );
	}
} );
