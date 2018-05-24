/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/audio';

export const settings = {
	title: __( 'Audio' ),

	description: __( 'Embed an audio file and a simple audio player.' ),

	icon: <svg height="36" width="36" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z"/></g></svg>,

	category: 'common',

	attributes: {
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'audio',
			attribute: 'src',
		},
		caption: {
			type: 'array',
			source: 'children',
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

	supports: {
		align: true,
	},

	edit,

	save( { attributes } ) {
		const { autoplay, caption, loop, preload, src } = attributes;
		return (
			<figure>
				<audio controls="controls" src={ src } autoPlay={ autoplay } loop={ loop } preload={ preload } />
				{ caption && caption.length > 0 && <RichText.Content tagName="figcaption" value={ caption } /> }
			</figure>
		);
	},
};
