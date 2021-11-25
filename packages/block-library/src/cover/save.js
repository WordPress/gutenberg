/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useInnerBlocksProps,
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
		isDark,
		isRepeated,
		overlayColor,
		url,
		alt,
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

	const bgStyle = {
		backgroundColor: ! overlayColorClass ? customOverlayColor : undefined,
		background: customGradient ? customGradient : undefined,
	};

	const objectPosition =
		// Prettier-ignore.
		focalPoint && isImgElement
			? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round(
					focalPoint.y * 100
			  ) }%`
			: undefined;

	const classes = classnames(
		{
			'is-light': ! isDark,
			'has-parallax': hasParallax,
			'is-repeated': isRepeated,
			'has-custom-content-position': ! isContentPositionCenter(
				contentPosition
			),
		},
		getPositionClassName( contentPosition )
	);

	const gradientValue = gradient || customGradient;

	return (
		<div { ...useBlockProps.save( { className: classes, style } ) }>
			<span
				aria-hidden="true"
				className={ classnames(
					'wp-block-cover__background',
					overlayColorClass,
					dimRatioToClass( dimRatio ),
					{
						'has-background-dim': dimRatio !== undefined,
						// For backwards compatibility. Former versions of the Cover Block applied
						// `.wp-block-cover__gradient-background` in the presence of
						// media, a gradient and a dim.
						'wp-block-cover__gradient-background':
							url && gradientValue && dimRatio !== 0,
						'has-background-gradient': gradientValue,
						[ gradientClass ]: gradientClass,
					}
				) }
				style={ bgStyle }
			/>

			{ isImageBackground && isImgElement && url && (
				<img
					className={ classnames(
						'wp-block-cover__image-background',
						id ? `wp-image-${ id }` : null
					) }
					alt={ alt }
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
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-cover__inner-container',
				} ) }
			/>
		</div>
	);
}
