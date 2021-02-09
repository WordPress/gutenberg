/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { alt, url, id, anchor, duotone } ) =>
				createBlock( 'core/media-text', {
					mediaAlt: alt,
					mediaId: id,
					mediaUrl: url,
					mediaType: 'image',
					anchor,
					duotone,
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			transform: ( { src, id, anchor, duotone } ) =>
				createBlock( 'core/media-text', {
					mediaId: id,
					mediaUrl: src,
					mediaType: 'video',
					anchor,
					duotone,
				} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { mediaType, mediaUrl } ) => {
				return ! mediaUrl || mediaType === 'image';
			},
			transform: ( { mediaAlt, mediaId, mediaUrl, anchor, duotone } ) => {
				return createBlock( 'core/image', {
					alt: mediaAlt,
					id: mediaId,
					url: mediaUrl,
					anchor,
					duotone,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( { mediaType, mediaUrl } ) => {
				return ! mediaUrl || mediaType === 'video';
			},
			transform: ( { mediaId, mediaUrl, anchor, duotone } ) => {
				return createBlock( 'core/video', {
					id: mediaId,
					src: mediaUrl,
					anchor,
					duotone,
				} );
			},
		},
	],
};

export default transforms;
