const { query, html } = wp.blocks.query;

wp.blocks.registerBlock( 'wp/text', {
	title: 'Text',
	icon: 'text',

	attributes: {
		value: query( 'p', html() )
	},

	edit( attributes, onChange ) {
		return wp.element.createElement( wp.blocks.Editable, {
			value: attributes.value,
			onChange: ( value ) => onChange( { value } )
		} );
	},

	save( attributes ) {
		return wp.element.createElement( 'p', null, attributes.value );
	}
} );
