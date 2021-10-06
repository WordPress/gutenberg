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
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
	blockAttributes,
} from './shared';

export default {
	attributes: {
		...blockAttributes,
		minHeight: {
			type: 'number',
		},
		gradient: {
			type: 'string',
		},
		customGradient: {
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
			customGradient,
			customOverlayColor,
			dimRatio,
			focalPoint,
			hasParallax,
			overlayColor,
			url,
			minHeight,
		} = attributes;
		const overlayColorClass = getColorClassName(
			'background-color',
			overlayColor
		);
		const gradientClass = __experimentalGetGradientClass( gradient );

		const style =
			backgroundType === IMAGE_BACKGROUND_TYPE
				? backgroundImageStyles( url )
				: {};
		if ( ! overlayColorClass ) {
			style.backgroundColor = customOverlayColor;
		}
		if ( focalPoint && ! hasParallax ) {
			style.backgroundPosition = `${ focalPoint.x * 100 }% ${
				focalPoint.y * 100
			}%`;
		}
		if ( customGradient && ! url ) {
			style.background = customGradient;
		}
		style.minHeight = minHeight || undefined;

		const classes = classnames(
			dimRatioToClass( dimRatio ),
			overlayColorClass,
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
				'has-background-gradient': customGradient,
				[ gradientClass ]: ! url && gradientClass,
			}
		);

		return (
			<div className={ classes } style={ style }>
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
				{ VIDEO_BACKGROUND_TYPE === backgroundType && url && (
					<video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/>
				) }
				<div className="wp-block-cover__inner-container">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};
