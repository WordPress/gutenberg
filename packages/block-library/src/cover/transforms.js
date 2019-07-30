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
			transform: ( { caption, url, align, id } ) => (
				createBlock( 'core/cover', {
					title: caption,
					url,
					align,
					id,
				} )
			),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			transform: ( { caption, src, align, id } ) => (
				createBlock( 'core/cover', {
					title: caption,
					url: src,
					align,
					id,
					backgroundType: VIDEO_BACKGROUND_TYPE,
				} )
			),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { backgroundType, url } ) => {
				return ! url || backgroundType === IMAGE_BACKGROUND_TYPE;
			},
			transform: ( { title, url, align, id } ) => (
				createBlock( 'core/image', {
					caption: title,
					url,
					align,
					id,
				} )
			),
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( { backgroundType, url } ) => {
				return ! url || backgroundType === VIDEO_BACKGROUND_TYPE;
			},
			transform: ( { title, url, align, id } ) => (
				createBlock( 'core/video', {
					caption: title,
					src: url,
					id,
					align,
				} )
			),
		},
	],
};

export default transforms;
