const Editable = wp.blocks.Editable;
const { query, html } = wp.blocks.query;

wp.blocks.registerBlock( 'core/quote', {
	title: 'Quote',
	icon: 'format-quote',
	category: 'quote',

	attributes: {
		value: query( 'blockquote', html( 'p' ) ),
		citation: html( 'cite,footer' )
	},

	edit( attributes, onChange ) {
		const { value, citation } = attributes;

		// Concat strings parsed by hpq from paragraph values into one string.
		const combinedValue = value.join( '' );
		return (
			<blockquote>
				<Editable
					value={ combinedValue }
					onChange={ ( newValue ) => onChange( { newValue } ) } />
				<cite>
					<Editable
						value={ citation }
						onChange={ ( newValue ) => onChange( { newValue } ) } />
				</cite>
			</blockquote>
		);
	},

	save( attributes ) {
		const { value, citation } = attributes;
		return (
			<blockquote>
				{ value }
				<cite>
					{ citation }
				</cite>
			</blockquote>
		);
	}
} );
