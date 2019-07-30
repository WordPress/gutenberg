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
		customOverlayColor,
		dimRatio,
		focalPoint,
		hasParallax,
		overlayColor,
		url,
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

	const classes = classnames(
		dimRatioToClass( dimRatio ),
		overlayColorClass,
		{
			'has-background-dim': dimRatio !== 0,
			'has-parallax': hasParallax,
		},
	);

	return (
		<div className={ classes } style={ style }>
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
