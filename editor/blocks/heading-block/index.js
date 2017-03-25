const { query, html, prop } = wp.blocks.query;

wp.blocks.registerBlock( 'wp/heading', {
	title: 'Heading',
	icon: 'heading',

	attributes: {
		value: query( 'h1,h2,h3,h4,h5,h6', html() ),
		headingType: query( 'h1,h2,h3,h4,h5,h6', prop( 'nodeName' ) ),
	},

	edit( attributes, onChange ) {
		return wp.element.createElement( wp.blocks.EditableHeading, {
			value: attributes.value,
			headingType: attributes.headingType,
			onChange: ( value ) => onChange( { value } )
		} );
	},

	save( attributes ) {
		return wp.element.createElement( 'p', null, attributes.value );
	}
} );
