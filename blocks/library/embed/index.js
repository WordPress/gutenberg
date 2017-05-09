/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { registerBlock, query } from '../../api';
import Editable from '../../components/editable';

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

		if ( ! url ) {
			return (
				<div className="blocks-embed is-placeholder">
					<div className="placeholder__label">
						<Dashicon icon="cloud" />
						{ wp.i18n.__( 'Embed URL' ) }
					</div>
					<div className="placeholder__fieldset">
						<input type="url" className="placeholder__input" placeholder={ wp.i18n.__( 'Enter URL to embed here...' ) } />
						<Button isLarge>
							{ wp.i18n.__( 'Embed' ) }
						</Button>
					</div>
				</div>
			);
		}

		return (
			<figure>
				<div className="iframe-overlay">
					<iframe src={ url } title={ title } />
				</div>
				{ ( caption && caption.length > 0 ) || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ wp.i18n.__( 'Write caption…' ) }
						value={ caption }
						focus={ focus }
						onFocus={ setFocus }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						inline
					/>
				) : null }
			</figure>
		);
	},

	save( { attributes } ) {
		const { url, title, caption } = attributes;
		const iframe = <iframe src={ url } title={ title } />;

		if ( ! caption || ! caption.length ) {
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
