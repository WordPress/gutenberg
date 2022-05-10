/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { alt, url, id, anchor } ) =>
				createBlock( 'core/media-text', {
					mediaAlt: alt,
					mediaId: id,
					mediaUrl: url,
					mediaType: 'image',
					anchor,
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			transform: ( { src, id, anchor } ) =>
				createBlock( 'core/media-text', {
					mediaId: id,
					mediaUrl: src,
					mediaType: 'video',
					anchor,
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/cover' ],
			transform: (
				{
					align,
					alt,
					anchor,
					backgroundType,
					customGradient,
					customOverlayColor,
					gradient,
					id,
					overlayColor,
					url,
				},
				innerBlocks
			) => {
				let additionalAttributes = {};

				if ( customGradient ) {
					additionalAttributes = {
						style: {
							color: {
								gradient: customGradient,
							},
						},
					};
				} else if ( customOverlayColor ) {
					additionalAttributes = {
						style: {
							color: {
								background: customOverlayColor,
							},
						},
					};
				}

				return createBlock(
					'core/media-text',
					{
						align,
						anchor,
						backgroundColor: overlayColor,
						gradient,
						mediaAlt: alt,
						mediaId: id,
						mediaType: backgroundType,
						mediaUrl: url,
						...additionalAttributes,
					},
					innerBlocks
				);
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { mediaType, mediaUrl } ) => {
				return ! mediaUrl || mediaType === 'image';
			},
			transform: ( { mediaAlt, mediaId, mediaUrl, anchor } ) => {
				return createBlock( 'core/image', {
					alt: mediaAlt,
					id: mediaId,
					url: mediaUrl,
					anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( { mediaType, mediaUrl } ) => {
				return ! mediaUrl || mediaType === 'video';
			},
			transform: ( { mediaId, mediaUrl, anchor } ) => {
				return createBlock( 'core/video', {
					id: mediaId,
					src: mediaUrl,
					anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/cover' ],
			transform: (
				{
					align,
					anchor,
					backgroundColor,
					focalPoint,
					gradient,
					mediaAlt,
					mediaId,
					mediaType,
					mediaUrl,
					style,
					textColor,
				},
				innerBlocks
			) => {
				const additionalAttributes = {};

				if ( style?.color?.gradient ) {
					additionalAttributes.customGradient = style.color.gradient;
				} else if ( style?.color?.background ) {
					additionalAttributes.customOverlayColor =
						style.color.background;
				}

				const coverAttributes = {
					align,
					alt: mediaAlt,
					anchor,
					backgroundType: mediaType,
					dimRatio: !! mediaUrl ? 50 : 100,
					focalPoint,
					gradient,
					id: mediaId,
					overlayColor: backgroundColor,
					url: mediaUrl,
					...additionalAttributes,
				};
				const customTextColor = style?.color?.text;

				// Attempt to maintain any text color selection.
				// Cover block's do not opt into color block support so we
				// cannot directly copy the color attributes across.
				if ( ! textColor && ! customTextColor ) {
					return createBlock(
						'core/cover',
						coverAttributes,
						innerBlocks
					);
				}

				const coloredInnerBlocks = innerBlocks.map( ( innerBlock ) => {
					const {
						attributes: { style: innerStyle },
					} = innerBlock;

					// Only apply the media and text color if the inner block
					// doesn't set its own color block support selection.
					if (
						innerBlock.attributes.textColor ||
						innerStyle?.color?.text
					) {
						return innerBlock;
					}

					const newAttributes = { textColor };

					// Only add or extend inner block's style object if we have
					// a custom text color from the media & text block.
					if ( customTextColor ) {
						newAttributes.style = {
							...innerStyle,
							color: {
								...innerStyle?.color,
								text: customTextColor,
							},
						};
					}

					return createBlock(
						innerBlock.name,
						{
							...innerBlock.attributes,
							...newAttributes,
						},
						innerBlock.innerBlocks
					);
				} );

				return createBlock(
					'core/cover',
					coverAttributes,
					coloredInnerBlocks
				);
			},
		},
	],
};

export default transforms;
