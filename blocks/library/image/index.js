/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { attr, children } = query;

registerBlock( 'core/image', {
	title: wp.i18n.__( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: children( 'figcaption' )
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, alt, caption } = attributes;

		return (
			<figure>
				<img src={ url } alt={ alt } />
				{ caption || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ wp.i18n.__( 'Write caption…' ) }
						value={ caption }
						focus={ focus }
						onFocus={ setFocus }
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
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	}
} );
