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

export const name = 'core/audio';

export const settings = {
	title: __( 'Audio' ),

	description: __( 'Embed a simple audio player.' ),

	icon,

	category: 'common',

	attributes: {
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'audio',
			attribute: 'src',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
		},
		id: {
			type: 'number',
		},
		autoplay: {
			type: 'boolean',
			source: 'attribute',
			selector: 'audio',
			attribute: 'autoplay',
		},
		loop: {
			type: 'boolean',
			source: 'attribute',
			selector: 'audio',
			attribute: 'loop',
		},
		preload: {
			type: 'string',
			source: 'attribute',
			selector: 'audio',
			attribute: 'preload',
		},
	},

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
