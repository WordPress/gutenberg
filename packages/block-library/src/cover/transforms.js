/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { IMAGE_BACKGROUND_TYPE, VIDEO_BACKGROUND_TYPE } from './shared';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { caption, url, align, id, anchor, style } ) =>
				createBlock(
					'core/cover',
					{
						url,
						align,
						id,
						anchor,
						style: {
							color: {
								duotone: style.color.duotone,
							},
						},
					},
					[
						createBlock( 'core/paragraph', {
							content: caption,
							fontSize: 'large',
						} ),
					]
				),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			transform: ( { caption, src, align, id, anchor } ) =>
				createBlock(
					'core/cover',
					{
						url: src,
						align,
						id,
						backgroundType: VIDEO_BACKGROUND_TYPE,
						anchor,
					},
					[
						createBlock( 'core/paragraph', {
							content: caption,
							fontSize: 'large',
						} ),
					]
				),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( {
				backgroundType,
				url,
				overlayColor,
				customOverlayColor,
				gradient,
				customGradient,
			} ) => {
				if ( url ) {
					// If a url exists the transform could happen if that URL represents an image background.
					return backgroundType === IMAGE_BACKGROUND_TYPE;
				}
				// If a url is not set the transform could happen if the cover has no background color or gradient;
				return (
					! overlayColor &&
					! customOverlayColor &&
					! gradient &&
					! customGradient
				);
			},
			transform: ( { title, url, align, id, anchor, style } ) =>
				createBlock( 'core/image', {
					caption: title,
					url,
					align,
					id,
					anchor,
					style: {
						color: {
							duotone: style.color.duotone,
						},
					},
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( {
				backgroundType,
				url,
				overlayColor,
				customOverlayColor,
				gradient,
				customGradient,
			} ) => {
				if ( url ) {
					// If a url exists the transform could happen if that URL represents a video background.
					return backgroundType === VIDEO_BACKGROUND_TYPE;
				}
				// If a url is not set the transform could happen if the cover has no background color or gradient;
				return (
					! overlayColor &&
					! customOverlayColor &&
					! gradient &&
					! customGradient
				);
			},
			transform: ( { title, url, align, id, anchor } ) =>
				createBlock( 'core/video', {
					caption: title,
					src: url,
					id,
					align,
					anchor,
				} ),
		},
	],
};

export default transforms;
