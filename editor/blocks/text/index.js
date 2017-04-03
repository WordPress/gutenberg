const { html, query } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'core/text', {
	title: wp.i18n.__( 'Text' ),

	icon: 'text',

	category: 'common',

	attributes: {
		value: query( 'p', html() )
	},

	edit( { attributes, onChange } ) {
		return (
			<Editable
				tagName="p"
				value={ attributes.value[ 0 ] }
				onChange={ ( value ) => onChange( { value } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <p>{ attributes.value }</p>;
	}
} );
