/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name, attributes: blockAttributes } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Image' ),
	description: __( 'Insert an image to make a visual statement.' ),
	icon,
	keywords: [
		'img', // "img" is not translated as it is intended to reflect the HTML <img> tag.
		__( 'photo' ),
	],
	transforms,
	getEditWrapperProps( attributes ) {
		const { align, width } = attributes;
		if ( 'left' === align || 'center' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},
	edit,
	save,
	deprecated: [
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { url, alt, caption, align, href, width, height, id } = attributes;

				const classes = classnames( {
					[ `align${ align }` ]: align,
					'is-resized': width || height,
				} );

				const image = (
					<img
						src={ url }
						alt={ alt }
						className={ id ? `wp-image-${ id }` : null }
						width={ width }
						height={ height }
					/>
				);

				return (
					<figure className={ classes }>
						{ href ? <a href={ href }>{ image }</a> : image }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { url, alt, caption, align, href, width, height, id } = attributes;

				const image = (
					<img
						src={ url }
						alt={ alt }
						className={ id ? `wp-image-${ id }` : null }
						width={ width }
						height={ height }
					/>
				);

				return (
					<figure className={ align ? `align${ align }` : null } >
						{ href ? <a href={ href }>{ image }</a> : image }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { url, alt, caption, align, href, width, height } = attributes;
				const extraImageProps = width || height ? { width, height } : {};
				const image = <img src={ url } alt={ alt } { ...extraImageProps } />;

				let figureStyle = {};

				if ( width ) {
					figureStyle = { width };
				} else if ( align === 'left' || align === 'right' ) {
					figureStyle = { maxWidth: '50%' };
				}

				return (
					<figure className={ align ? `align${ align }` : null } style={ figureStyle }>
						{ href ? <a href={ href }>{ image }</a> : image }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
	],
};
