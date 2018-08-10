/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/editor';
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/video';

export const settings = {
	title: __( 'Video' ),

	description: __( 'Embed a video file and a simple video player.' ),

	icon: 'format-video',

	category: 'common',

	attributes: {
		autoplay: {
			type: 'boolean',
			source: 'attribute',
			selector: 'video',
			attribute: 'autoplay',
		},
		caption: {
			type: 'array',
			source: 'children',
			selector: 'figcaption',
		},
		controls: {
			type: 'boolean',
			source: 'attribute',
			selector: 'video',
			attribute: 'controls',
			default: true,
		},
		id: {
			type: 'number',
		},
		loop: {
			type: 'boolean',
			source: 'attribute',
			selector: 'video',
			attribute: 'loop',
		},
		muted: {
			type: 'boolean',
			source: 'attribute',
			selector: 'video',
			attribute: 'muted',
		},
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'video',
			attribute: 'src',
		},
	},

	transforms: {
		from: [
			{
				type: 'files',
				isMatch( files ) {
					return files.length === 1 && files[ 0 ].type.indexOf( 'video/' ) === 0;
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
		],
	},

	supports: {
		align: true,
	},

	edit,

	save( { attributes } ) {
		const { autoplay, caption, controls, loop, muted, src } = attributes;
		return (
			<figure>
				{ src && (
					<video
						autoPlay={ autoplay }
						controls={ controls }
						src={ src }
						loop={ loop }
						muted={ muted }
					/>
				) }
				{ caption && caption.length > 0 && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};
