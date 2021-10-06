/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	InnerBlocks,
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
	getPositionClassName,
	isContentPositionCenter,
	blockAttributes,
} from './shared';

export default {
	attributes: {
		...blockAttributes,
		isRepeated: {
			type: 'boolean',
			default: false,
		},
		minHeight: {
			type: 'number',
		},
		minHeightUnit: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		customGradient: {
			type: 'string',
		},
		contentPosition: {
			type: 'string',
		},
	},
	supports: {
		align: true,
	},
	save( { attributes } ) {
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

		const style = isImageBackground ? backgroundImageStyles( url ) : {};
		const videoStyle = {};

		if ( ! overlayColorClass ) {
			style.backgroundColor = customOverlayColor;
		}

		if ( customGradient && ! url ) {
			style.background = customGradient;
		}
		style.minHeight = minHeight || undefined;

		let positionValue;

		if ( focalPoint ) {
			positionValue = `${ Math.round(
				focalPoint.x * 100
			) }% ${ Math.round( focalPoint.y * 100 ) }%`;

			if ( isImageBackground && ! hasParallax ) {
				style.backgroundPosition = positionValue;
			}

			if ( isVideoBackground ) {
				videoStyle.objectPosition = positionValue;
			}
		}

		const classes = classnames(
			dimRatioToClass( dimRatio ),
			overlayColorClass,
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
				{ isVideoBackground && url && (
					<video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						playsInline
						src={ url }
						style={ videoStyle }
					/>
				) }
				<div className="wp-block-cover__inner-container">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};
