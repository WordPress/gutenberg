const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function Heading( { nodeName = 'H2', children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

wp.blocks.registerBlock( 'core/heading', {
	title: 'Heading',
	icon: 'heading',
	category: 'common',

	attributes: {
		value: html( 'h1,h2,h3,h4,h5,h6' ),
		headingType: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' )
	},

	edit( attributes, onChange ) {
		const { headingType = 'H2', value } = attributes;

		return (
				<Editable
					nodeName={ headingType }
					value={ value }
					onChange={ ( nextValue ) => onChange( { value: nextValue } ) } />

		);
	},

	save( attributes ) {
		const { headingType = 'H2', value } = attributes;
		return <Heading nodeName={ headingType }>{ value }</Heading>;
	}
} );