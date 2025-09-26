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
		isLink,
		aspectRatio,
		width,
		height,
		scale,
		rel,
		linkTarget,
		overlayColor,
		customOverlayColor,
		dimRatio,
		gradient,
		customGradient,
		caption,
	} = attributes;

	const borderProps = getBorderClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );

	const classes = clsx( {
		'is-resized': width || height,
		'has-custom-border':
			!! borderProps.className ||
			( borderProps.style &&
				Object.keys( borderProps.style ).length > 0 ),
	} );

	const overlayClasses = clsx( 'wp-block-post-featured-image__overlay', {
		'has-background-dim': dimRatio !== undefined && dimRatio !== 0,
		[ `has-background-dim-${ dimRatio }` ]: dimRatio !== undefined && dimRatio !== 0,
		[ `has-${ overlayColor }-background-color` ]: overlayColor,
		'has-background-gradient': gradient || customGradient,
		[ `has-${ gradient }-gradient-background` ]: gradient,
	} );

	const overlayStyles = {
		...( customOverlayColor && { backgroundColor: customOverlayColor } ),
		...( customGradient && { backgroundImage: customGradient } ),
	};

	const hasOverlay = dimRatio !== undefined && dimRatio !== 0;

	const overlayElement = hasOverlay && (
		<span
			className={ overlayClasses }
			style={ overlayStyles }
			aria-hidden="true"
		/>
	);

	const imageStyles = {
		...borderProps.style,
		...shadowProps.style,
		aspectRatio,
		width: !! aspectRatio ? '100%' : width,
		height: aspectRatio ? '100%' : height,
		objectFit: !! ( height || aspectRatio ) ? scale : undefined,
	};

	const figureStyles = {
		aspectRatio,
		width,
		height,
	};

	const imageElement = (
		<img
			className={ borderProps.className }
			style={ imageStyles }
			alt=""
		/>
	);

	const content = isLink ? (
		<a
			href="#empty" // This value will be replaced during Server Side Render.
			target={ linkTarget }
			rel={ rel || undefined }
		>
			{ imageElement }
			{ overlayElement }
		</a>
	) : (
		<>
			{ imageElement }
			{ overlayElement }
		</>
	);


	return (
		<figure
			{ ...useBlockProps.save( {
				className: classes,
				style: figureStyles,
			} ) }
		>
			{ content }
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
