/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { RichText, getColorClassName } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

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
		title: {
			type: 'string',
			source: 'html',
			selector: 'p',
		},
		contentAlign: {
			type: 'string',
			default: 'center',
		},
	},
	supports: {
		align: true,
	},
	save( { attributes } ) {
		const {
			backgroundType,
			contentAlign,
			customOverlayColor,
			dimRatio,
			focalPoint,
			hasParallax,
			overlayColor,
			title,
			url,
		} = attributes;
		const overlayColorClass = getColorClassName(
			'background-color',
			overlayColor
		);
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

		const classes = classnames(
			dimRatioToClass( dimRatio ),
			overlayColorClass,
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
				[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
			}
		);

		return (
			<div className={ classes } style={ style }>
				{ VIDEO_BACKGROUND_TYPE === backgroundType && url && (
					<video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/>
				) }
				{ ! RichText.isEmpty( title ) && (
					<RichText.Content
						tagName="p"
						className="wp-block-cover-text"
						value={ title }
					/>
				) }
			</div>
		);
	},
	migrate( attributes ) {
		return [
			omit( attributes, [ 'title', 'contentAlign' ] ),
			[
				createBlock( 'core/paragraph', {
					content: attributes.title,
					align: attributes.contentAlign,
					fontSize: 'large',
					placeholder: __( 'Write title…' ),
				} ),
			],
		];
	},
};
