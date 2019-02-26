/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/video';

export const settings = {
	title: __( 'Video' ),

	description: __( 'Embed a video from your media library or upload a new one.' ),

	icon,

	keywords: [ __( 'movie' ) ],

	category: 'common',

	attributes: {
		autoplay: {
			type: 'boolean',
			source: 'attribute',
			selector: 'video',
			attribute: 'autoplay',
		},
		caption: {
			type: 'string',
			source: 'html',
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
		poster: {
			type: 'string',
			source: 'attribute',
			selector: 'video',
			attribute: 'poster',
		},
		preload: {
			type: 'string',
			source: 'attribute',
			selector: 'video',
			attribute: 'preload',
			default: 'metadata',
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
		const { autoplay, caption, controls, loop, muted, poster, preload, src } = attributes;
		return (
			<figure>
				{ src && (
					<video
						autoPlay={ autoplay }
						controls={ controls }
						loop={ loop }
						muted={ muted }
						poster={ poster }
						preload={ preload !== 'metadata' ? preload : undefined }
						src={ src }
					/>
				) }
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};
