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
			transform: ( { caption, url, align, id, anchor, duotone } ) =>
				createBlock(
					'core/cover',
					{
						url,
						align,
						id,
						anchor,
						duotone,
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
		{
			type: 'block',
			blocks: [ 'core/group' ],
			isMatch: ( { backgroundColor, gradient, style } ) => {
				/*
				 * Make sure the group has a background, since if the cover block is
				 * created without one, it displays the "placeholder" state,
				 * which makes it look like it has no contents.
				 */
				return (
					backgroundColor ||
					style?.color?.background ||
					style?.color?.gradient ||
					gradient
				);
			},
			transform: (
				{ align, anchor, backgroundColor, gradient, style },
				innerBlocks
			) => {
				/*
				 * Clone the blocks to be transformed.
				 * Failing to create new block references causes the original blocks
				 * to be replaced in the switchToBlockType call thereby meaning they
				 * are removed both from their original location and within the
				 * new cover block.
				 */
				const coverInnerBlocks = innerBlocks.map( ( block ) => {
					return createBlock(
						block.name,
						block.attributes,
						block.innerBlocks
					);
				} );

				return createBlock(
					'core/cover',
					{
						align,
						anchor,
						overlayColor: backgroundColor,
						customOverlayColor: style?.color?.background,
						gradient,
						customGradient: style?.color?.gradient,
					},
					coverInnerBlocks
				);
			},
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
			transform: ( { title, url, align, id, anchor, duotone } ) =>
				createBlock( 'core/image', {
					caption: title,
					url,
					align,
					id,
					anchor,
					duotone,
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
