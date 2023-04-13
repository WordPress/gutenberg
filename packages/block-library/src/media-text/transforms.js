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
					style,
					textColor,
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

				// Maintain custom text color block support value.
				if ( style?.color?.text ) {
					additionalAttributes.style = {
						color: {
							...additionalAttributes.style?.color,
							text: style.color.text,
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
						textColor,
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

				// Migrate the background styles or gradient to Cover's custom
				// gradient and overlay properties.
				if ( style?.color?.gradient ) {
					additionalAttributes.customGradient = style.color.gradient;
				} else if ( style?.color?.background ) {
					additionalAttributes.customOverlayColor =
						style.color.background;
				}

				// Maintain custom text color support style.
				if ( style?.color?.text ) {
					additionalAttributes.style = {
						color: { text: style.color.text },
					};
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
					textColor,
					url: mediaUrl,
					...additionalAttributes,
				};

				return createBlock(
					'core/cover',
					coverAttributes,
					innerBlocks
				);
			},
		},
	],
};

export default transforms;
