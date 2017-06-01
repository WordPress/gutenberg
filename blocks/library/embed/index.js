/**
 * WordPress dependencies
 */
import { Button, Placeholder } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';

const { attr, children } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlockType( 'core/embed', {
	title: wp.i18n.__( 'Embed' ),

	icon: 'video-alt3',

	category: 'embed',

	attributes: {
		url: attr( 'iframe', 'src' ),
		title: attr( 'iframe', 'title' ),
		caption: children( 'figcaption' ),
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-full-width',
			title: wp.i18n.__( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, title, caption } = attributes;

		if ( ! url ) {
			return (
				<Placeholder icon="cloud" label={ wp.i18n.__( 'Embed URL' ) } className="blocks-embed">
					<input type="url" className="placeholder__input" placeholder={ wp.i18n.__( 'Enter URL to embed here...' ) } />
					<Button isLarge>
						{ wp.i18n.__( 'Embed' ) }
					</Button>
				</Placeholder>
			);
		}

		return (
			<figure className="blocks-embed">
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
						inlineToolbar
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
	},
} );
