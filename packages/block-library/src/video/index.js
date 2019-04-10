/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Video' ),

	description: __( 'Embed a video from your media library or upload a new one.' ),

	icon,

	keywords: [ __( 'movie' ) ],

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
			{
				type: 'shortcode',
				tag: 'video',
				attributes: {
					src: {
						type: 'string',
						shortcode: ( { named: { src } } ) => {
							return src;
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
	},

	supports: {
		align: true,
	},

	edit,

	save( { attributes } ) {
		const { autoplay, caption, controls, loop, muted, poster, preload, src, playsInline } = attributes;
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
						playsInline={ playsInline }
					/>
				) }
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};
