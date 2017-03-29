const Editable = wp.blocks.Editable;
const { html } = wp.blocks.query;

wp.blocks.registerBlock( 'core/quote', {
	title: 'Quote',
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: html( 'blockquote > p' ),
		citation: html( 'footer' )
	},

	edit( attributes, onChange ) {
		const { value, citation } = attributes;

		return (
			<blockquote>
				<Editable
					value={ value }
					onChange={ ( newValue ) => onChange( { value: newValue } ) } />
				<footer>
					<Editable
						value={ citation }
						onChange={ ( newValue ) => onChange( { citation: newValue } ) } />
				</footer>
			</blockquote>
		);
	},

	save( attributes ) {
		const { value, citation } = attributes;
		return (
			<blockquote>
				{ value }
				<footer>
					{ citation }
				</footer>
			</blockquote>
		);
	}
} );
