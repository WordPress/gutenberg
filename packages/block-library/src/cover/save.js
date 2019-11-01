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
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';

export default function save( { attributes } ) {
	const {
		backgroundType,
		customGradient,
		customOverlayColor,
		dimRatio,
		focalPoint,
		hasParallax,
		overlayColor,
		url,
		minHeight,
	} = attributes;
	const overlayColorClass = getColorClassName( 'background-color', overlayColor );
	const style = backgroundType === IMAGE_BACKGROUND_TYPE ?
		backgroundImageStyles( url ) :
		{};
	if ( ! overlayColorClass ) {
		style.backgroundColor = customOverlayColor;
	}
	if ( focalPoint && ! hasParallax ) {
		style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
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
		},
	);

	return (
		<div className={ classes } style={ style }>
			{ url && customGradient && dimRatio !== 0 && (
				<span
					aria-hidden="true"
					className="wp-block-cover__gradient-background"
					style={ { background: customGradient } }
				/>
			) }
			{ VIDEO_BACKGROUND_TYPE === backgroundType && url && ( <video
				className="wp-block-cover__video-background"
				autoPlay
				muted
				loop
				src={ url }
			/> ) }
			<div className="wp-block-cover__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
