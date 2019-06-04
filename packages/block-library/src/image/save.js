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
		align,
		href,
		rel,
		linkClass,
		width,
		height,
		id,
		linkTarget,
		sizeSlug,
	} = attributes;

	const classes = classnames( {
		[ `align${ align }` ]: align,
		[ `size-${ sizeSlug }` ]: sizeSlug,
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

	const figure = (
		<>
			{ href ? (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ rel }
				>
					{ image }
				</a>
			) : image }
			{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
		</>
	);

	if ( 'left' === align || 'right' === align || 'center' === align ) {
		return (
			<div>
				<figure className={ classes }>
					{ figure }
				</figure>
			</div>
		);
	}

	return (
		<figure className={ classes }>
			{ figure }
		</figure>
	);
}
