/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'files',
			isMatch( files ) {
				return (
					files.length === 1 &&
					files[ 0 ].type.indexOf( 'video/' ) === 0
				);
			},
			transform( files ) {
				const file = files[ 0 ];
				// We don't need to upload the media directly here
				// It's already done as part of the `componentDidMount`
				// in the video block
				const block = createBlock( 'core/video', {
					src: createBlobURL( file ),
				} );
				return block;
			},
		},
		{
			type: 'shortcode',
			tag: 'video',
			attributes: {
				src: {
					type: 'string',
					shortcode: ( {
						named: { src, mp4, m4v, webm, ogv, flv },
					} ) => {
						return src || mp4 || m4v || webm || ogv || flv;
					},
				},
				poster: {
					type: 'string',
					shortcode: ( { named: { poster } } ) => {
						return poster;
					},
				},
				loop: {
					type: 'string',
					shortcode: ( { named: { loop } } ) => {
						return loop;
					},
				},
				autoplay: {
					type: 'string',
					shortcode: ( { named: { autoplay } } ) => {
						return autoplay;
					},
				},
				preload: {
					type: 'string',
					shortcode: ( { named: { preload } } ) => {
						return preload;
					},
				},
			},
		},
	],
};

export default transforms;
