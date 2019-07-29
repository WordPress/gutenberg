/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		url,
		alt,
		caption,
		align = 'none',
		href,
		rel,
		linkClass,
		width,
		height,
		id,
		linkTarget,
		sizeSlug,
		expand,
	} = attributes;

	const classes = classnames( {
		[ `align${ align }` ]: align,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'is-resized': width || height,
		[ `expand${ expand }` ]: expand ? expand : false,
	} );

	const Image = (
		<img
			src={ url }
			alt={ alt }
			className={ id ? `wp-image-${ id }` : null }
			width={ width }
			height={ height }
		/>
	);

	const ImageElement = href ?
		<a
			className={ linkClass }
			href={ href }
			target={ linkTarget }
			rel={ rel }
		>
			{ Image }
		</a> :
		Image;

	const ImageWrapper = expand ?
		<figure className={ classes }>
			<div
				className="wp-block-image__image-wrapper"
				style={ { backgroundImage: `url(${ url })` } }
			>
				{ ImageElement }
			</div>
			{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
		</figure> :
		<figure className={ classes }>
			{ ImageElement }
			{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
		</figure>;

	if ( 'left' === align || 'right' === align || 'center' === align ) {
		return <div>{ ImageWrapper }</div>;
	}

	return ImageWrapper;
}
