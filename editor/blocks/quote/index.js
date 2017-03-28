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
		return (
			<blockquote>
				<Editable value={ value } onChange={ onChange } />
				<cite>
					<Editable value={ citation } onChange={ onChange } />
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
