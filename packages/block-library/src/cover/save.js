/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	getColorClassName,
	__experimentalGetGradientClass,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	dimRatioToClass,
	isContentPositionCenter,
	getPositionClassName,
} from './shared';

export default function save( { attributes } ) {
	const {
		backgroundType,
		gradient,
		contentPosition,
		customGradient,
		customOverlayColor,
		dimRatio,
		focalPoint,
		hasParallax,
		isRepeated,
		overlayColor,
		url,
		id,
		minHeight: minHeightProp,
		minHeightUnit,
	} = attributes;
	const overlayColorClass = getColorClassName(
		'background-color',
		overlayColor
	);
	const gradientClass = __experimentalGetGradientClass( gradient );
	const minHeight = minHeightUnit
		? `${ minHeightProp }${ minHeightUnit }`
		: minHeightProp;

	const isImageBackground = IMAGE_BACKGROUND_TYPE === backgroundType;
	const isVideoBackground = VIDEO_BACKGROUND_TYPE === backgroundType;

	const isImgElement = ! ( hasParallax || isRepeated );

	const style = {
		backgroundColor: ! overlayColorClass ? customOverlayColor : undefined,
		backgroundImage: customGradient && ! url ? customGradient : undefined,
		minHeight: minHeight || undefined,
	};

	const backgroundImage = ! isImgElement && url ? `url(${ url })` : undefined;
	// prettier-ignore
	const backgroundPosition = focalPoint
		? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round( focalPoint.y * 100 ) }%`
		: undefined;

	const classes = classnames(
		dimRatioToClass( dimRatio ),
		overlayColorClass,
		{
			'has-background-dim': dimRatio !== 0,
			'has-background-gradient': gradient || customGradient,
			[ gradientClass ]: ! url && gradientClass,
			'has-custom-content-position': ! isContentPositionCenter(
				contentPosition
			),
		},
		getPositionClassName( contentPosition )
	);

	const backgroundClasses = classnames( {
		'has-parallax': hasParallax,
		'is-repeated': isRepeated,
	} );

	return (
		<div { ...useBlockProps.save( { className: classes, style } ) }>
			{ url && ( gradient || customGradient ) && dimRatio !== 0 && (
				<span
					aria-hidden="true"
					className={ classnames(
						'wp-block-cover__gradient-background',
						gradientClass
					) }
					style={
						customGradient
							? { background: customGradient }
							: undefined
					}
				/>
			) }
			{ url && isImageBackground && ! isImgElement && (
				<div
					role="img"
					className={ classnames(
						'wp-block-cover__image-background',
						backgroundClasses
					) }
					style={ { backgroundImage, backgroundPosition } }
				/>
			) }
			{ url && isImageBackground && isImgElement && (
				<img
					className={ classnames(
						'wp-block-cover__image-background',
						id ? `wp-image-${ id }` : null
					) }
					alt=""
					src={ url }
					style={ { objectPosition: backgroundPosition } }
					data-object-fit="cover"
					data-object-position={ backgroundPosition }
				/>
			) }
			{ url && isVideoBackground && (
				<video
					className={ classnames(
						'wp-block-cover__video-background',
						'intrinsic-ignore'
					) }
					autoPlay
					muted
					loop
					playsInline
					src={ url }
					style={ { objectPosition: backgroundPosition } }
					data-object-fit="cover"
					data-object-position={ backgroundPosition }
				/>
			) }
			<div className="wp-block-cover__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
