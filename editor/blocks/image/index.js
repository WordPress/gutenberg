const { attr, html } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'core/image', {
	title: wp.i18n.__( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		src: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: html( 'figcaption' )
	},

	edit( { attributes, isSelected, setAttributes } ) {
		const { src, alt, caption } = attributes;

		return (
			<figure>
				<img src={ src } alt={ alt } />
				{ caption || isSelected ? (
					<Editable
						tagName="figcaption"
						placeholder={ wp.i18n.__( 'Write caption…' ) }
						value={ caption }
						onChange={ ( value ) => setAttributes( { caption: value } ) } />
				) : null }
			</figure>
		);
	},

	save( { attributes } ) {
		const { src, alt, caption } = attributes;

		return (
			<figure>
				<img src={ src } alt={ alt } />
				{ caption ? (
					<figcaption dangerouslySetInnerHTML={ { __html: caption } } />
				) : null }
			</figure>
		);
	}
} );
