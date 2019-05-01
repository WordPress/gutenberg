/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';

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
	} = attributes;

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

	const figure = (
		<Fragment>
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
		</Fragment>
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
