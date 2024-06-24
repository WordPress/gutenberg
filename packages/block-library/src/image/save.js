/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
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
		metadata,
	} = attributes;

	const newRel = ! rel ? undefined : rel;
	const borderProps = getBorderClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );

	const classes = clsx( {
		// All other align classes are handled by block supports.
		// `{ align: 'none' }` is unique to transforms for the image block.
		alignnone: 'none' === align,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'is-resized': width || height,
		'has-custom-border':
			!! borderProps.className ||
			( borderProps.style &&
				Object.keys( borderProps.style ).length > 0 ),
	} );

	const imageClasses = clsx( borderProps.className, {
		[ `wp-image-${ id }` ]: !! id,
	} );

	const image = (
		<img
			src={ url }
			alt={ alt }
			className={ imageClasses || undefined }
			style={ {
				...borderProps.style,
				...shadowProps.style,
				aspectRatio,
				objectFit: scale,
				width,
				height,
			} }
			title={ title }
		/>
	);

	const isPatternOverridesEnabled =
		metadata?.bindings?.__default?.source === 'core/pattern-overrides';

	const figure = (
		<>
			{ /* Don't add links in images with pattern overrides until they are supported. */ }
			{ href && ! isPatternOverridesEnabled ? (
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
			{ /* Don't add caption in images with pattern overrides until it is supported. */ }
			{ ! RichText.isEmpty( caption ) && ! isPatternOverridesEnabled && (
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
