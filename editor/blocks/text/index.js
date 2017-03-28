const { html } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'core/text', {
	title: 'Text',
	icon: 'text',

	attributes: {
		value: html()
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
