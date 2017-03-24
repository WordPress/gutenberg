const { query, html } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'wp/text', {
	title: 'Text',
	icon: 'text',

	attributes: {
		value: query( 'p', html() )
	},

	edit( attributes, onChange ) {
		return (
			<Editable
				value={ attributes.value }
				onChange={ ( value ) => onChange( { value } ) }
			/>
		);
	},

	save( attributes ) {
		return <p>{ attributes.value }</p>;
	}
} );
