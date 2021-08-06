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
	backgroundImageStyles,
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
		...( isImageBackground && ! isImgElement
			? backgroundImageStyles( url )
			: {} ),
		minHeight: minHeight || undefined,
	};
	const objectPosition =
		// prettier-ignore
		focalPoint && isImgElement
			? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round( focalPoint.y * 100 ) }%`
			: undefined;

	const classes = classnames(
		dimRatioToClass( dimRatio ),
		{
			'has-background-dim': dimRatio !== 0,
			'has-parallax': hasParallax,
			'is-repeated': isRepeated,
			'has-background-gradient': gradient || customGradient,
			[ gradientClass ]: ! url && gradientClass,
			'has-custom-content-position': ! isContentPositionCenter(
				contentPosition
			),
		},
		getPositionClassName( contentPosition )
	);
	/**
	 * We default to `black` background to enable the opacity of
	 * images/videos when we haven't explicitly set any overlay color.
	 */
	const usedColor = overlayColor || customOverlayColor || 'black';
	return (
		<div { ...useBlockProps.save( { className: classes, style } ) }>
			{ dimRatio !== 0 && (
				<span
					aria-hidden="true"
					className={ classnames(
						'wp-block-cover__gradient-background',
						gradientClass,
						overlayColorClass
					) }
					style={ {
						backgroundImage: customGradient
							? customGradient
							: undefined,
						backgroundColor:
							! customGradient && ! overlayColorClass
								? usedColor
								: undefined,
						opacity: dimRatio / 100,
					} }
				/>
			) }
			{ isImageBackground && isImgElement && url && (
				<img
					className={ classnames(
						'wp-block-cover__image-background',
						id ? `wp-image-${ id }` : null
					) }
					alt=""
					src={ url }
					style={ { objectPosition } }
					data-object-fit="cover"
					data-object-position={ objectPosition }
				/>
			) }
			{ isVideoBackground && url && (
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
					style={ { objectPosition } }
					data-object-fit="cover"
					data-object-position={ objectPosition }
				/>
			) }
			<div className="wp-block-cover__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
