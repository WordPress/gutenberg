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
			transform: ( { caption, url, alt, align, id, anchor, style } ) =>
				createBlock(
					'core/cover',
					{
						dimRatio: 50,
						url,
						alt,
						align,
						id,
						anchor,
						style: {
							color: {
								duotone: style?.color?.duotone,
							},
						},
					},
					[
						createBlock( 'core/paragraph', {
							content: caption,
							fontSize: 'large',
							align: 'center',
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
						dimRatio: 50,
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
							align: 'center',
						} ),
					]
				),
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( attributes, innerBlocks ) => {
				const {
					align,
					anchor,
					backgroundColor,
					gradient,
					layout,
					style,
				} = attributes;
				// If no background or gradient color is provided, default to 50% opacity.
				// This matches the styling of a Cover block with a background image,
				// in the state where a background image has been removed.
				const dimRatio =
					backgroundColor ||
					style?.color?.background ||
					style?.color?.gradient
						? undefined
						: 50;

				const newAttributes = {
					align,
					anchor,
					dimRatio,
					overlayColor: backgroundColor,
					customOverlayColor: style?.color?.background,
					gradient,
					customGradient: style?.color?.gradient,
				};

				// For variations that use a flex layout (e.g. Row and Stack),
				// wrap the block in a Cover instead of converting directly to the cover block.
				if ( layout?.type === 'flex' ) {
					return createBlock( 'core/cover', newAttributes, [
						createBlock( 'core/group', attributes, innerBlocks ),
					] );
				}

				return createBlock(
					'core/cover',
					newAttributes,
					innerBlocks?.length
						? innerBlocks
						: [
								createBlock( 'core/paragraph', {
									fontSize: 'large',
									align: 'center',
								} ),
						  ]
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
			transform: ( { title, url, alt, align, id, anchor, style } ) =>
				createBlock( 'core/image', {
					caption: title,
					url,
					alt,
					align,
					id,
					anchor,
					style: {
						color: {
							duotone: style?.color?.duotone,
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
