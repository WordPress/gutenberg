const { attr, html } = wp.blocks.query;
const Editable = wp.blocks.Editable;

wp.blocks.registerBlock( 'core/image', {
	title: wp.i18n.__( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: html( 'figcaption' )
	},

	edit( { attributes, isSelected, setAttributes } ) {
		const { url, alt, caption } = attributes;

		return (
			<figure>
				<img src={ url } alt={ alt } />
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
		const { url, alt, caption } = attributes;
		const img = <img src={ url } alt={ alt } />;

		if ( ! caption ) {
			return img;
		}

		return (
			<figure>
				{ img }
				<figcaption dangerouslySetInnerHTML={ { __html: caption } } />
			</figure>
		);
	}
} );
