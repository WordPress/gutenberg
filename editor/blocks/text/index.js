const { html } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'core/text', {
	title: wp.i18n.__( 'Text' ),

	icon: 'text',

	category: 'common',

	attributes: {
		value: html()
	},

	edit( { attributes, onChange } ) {
		return (
			<Editable
				value={ attributes.value }
				onChange={ ( value ) => onChange( { value } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <p>{ attributes.value }</p>;
	}
} );
