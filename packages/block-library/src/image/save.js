/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

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
		aspectRatio,
		scale,
		id,
		linkTarget,
		sizeSlug,
		title,
	} = attributes;

	const newRel = ! rel ? undefined : rel;
	const borderProps = getBorderClassesAndStyles( attributes );

	const classes = classnames( {
		[ `align${ align }` ]: align,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'is-resized': width || height,
		'has-custom-border':
			!! borderProps.className ||
			( borderProps.style &&
				Object.keys( borderProps.style ).length > 0 ),
	} );

	const imageClasses = classnames( borderProps.className, {
		[ `wp-image-${ id }` ]: !! id,
	} );

	const image = (
		<img
			src={ url }
			alt={ alt }
			className={ imageClasses || undefined }
			style={ {
				...borderProps.style,
				aspectRatio,
				objectFit: scale,
			} }
			width={ width }
			height={ height }
			title={ title }
		/>
	);

	const figure = (
		<>
			{ href ? (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
				>
					{ image }
				</a>
			) : (
				image
			) }
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
				/>
			) }
		</>
	);

	return (
		<figure { ...useBlockProps.save( { className: classes } ) }>
			{ figure }
		</figure>
	);
}
