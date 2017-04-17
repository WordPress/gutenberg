/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { attr, html } = query;

registerBlock( 'core/image', {
	title: wp.i18n.__( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: html( 'figcaption' )
	},

	edit( { attributes, setAttributes, focus, updateFocus } ) {
		const { url, alt, caption } = attributes;

		// Disable reason: Clicking the image should set the focus to its caption

		/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/onclick-has-role, jsx-a11y/no-static-element-interactions */
		return (
			<figure>
				<img src={ url } alt={ alt } onClick={ updateFocus } />
				{ caption || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ wp.i18n.__( 'Write caption…' ) }
						value={ caption }
						focus={ focus }
						onFocus={ updateFocus }
						onChange={ ( value ) => setAttributes( { caption: value } ) } />
				) : null }
			</figure>
		);
		/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/onclick-has-role, jsx-a11y/no-static-element-interactions */
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
