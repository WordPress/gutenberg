/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { attr, children } = query;

registerBlock( 'core/embed', {
	title: wp.i18n.__( 'Embed' ),

	icon: 'video-alt3',

	category: 'common',

	attributes: {
		url: attr( 'iframe', 'src' ),
		title: attr( 'iframe', 'title' ),
		caption: children( 'figcaption' )
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, title, caption } = attributes;

		return (
			<figure>
				<div className="iframe-overlay">
					<iframe src={ url } title={ title } />
				</div>
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
		const { url, title, caption } = attributes;
		const iframe = <iframe src={ url } title={ title } />;

		if ( ! caption ) {
			return iframe;
		}

		return (
			<figure>
				{ iframe }
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	}
} );
