/**
 * External dependencies
 */
import { set } from 'lodash';

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
				const additionalAttributes = {};

				if ( customGradient ) {
					set(
						additionalAttributes,
						'style.color.gradient',
						customGradient
					);
				} else if ( customOverlayColor ) {
					set(
						additionalAttributes,
						'style.color.background',
						customOverlayColor
					);
				}

				return createBlock(
					'core/media-text',
					{
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
					anchor,
					backgroundColor,
					focalPoint,
					gradient,
					mediaAlt,
					mediaId,
					mediaType,
					mediaUrl,
					style,
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

				return createBlock(
					'core/cover',
					{
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
					},
					innerBlocks
				);
			},
		},
	],
};

export default transforms;
