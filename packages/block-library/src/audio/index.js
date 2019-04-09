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
	title: __( 'Audio' ),

	description: __( 'Embed a simple audio player.' ),

	icon,

	transforms: {
		from: [
			{
				type: 'files',
				isMatch( files ) {
					return files.length === 1 && files[ 0 ].type.indexOf( 'audio/' ) === 0;
				},
				transform( files ) {
					const file = files[ 0 ];
					// We don't need to upload the media directly here
					// It's already done as part of the `componentDidMount`
					// in the audio block
					const block = createBlock( 'core/audio', {
						src: createBlobURL( file ),
					} );

					return block;
				},
			},
			{
				type: 'shortcode',
				tag: 'audio',
				attributes: {
					src: {
						type: 'string',
						shortcode: ( { named: { src } } ) => {
							return src;
						},
					},
					loop: {
						type: 'string',
						shortcode: ( { named: { loop } } ) => {
							return loop;
						},
					},
					autoplay: {
						type: 'srting',
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
		const { autoplay, caption, loop, preload, src } = attributes;
		return (
			<figure>
				<audio controls="controls" src={ src } autoPlay={ autoplay } loop={ loop } preload={ preload } />
				{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
			</figure>
		);
	},
};
