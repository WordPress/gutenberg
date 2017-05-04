/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from 'api';
import Editable from 'components/editable';
// TODO: Revisit when we have a common components solution
import Dashicon from '../../../editor/components/dashicon';
import Button from '../../../editor/components/button';

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
					<div className="blocks-embed__placeholder-label">
						<Dashicon icon="cloud" />
						{ wp.i18n.__( 'Embed URL' ) }
					</div>
					<div className="blocks-embed__placeholder-fieldset">
						<input type="url" className="blocks-embed__placeholder-input" placeholder={ wp.i18n.__( 'Enter URL to embed here...' ) } />
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
				{ caption || !! focus ? (
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
