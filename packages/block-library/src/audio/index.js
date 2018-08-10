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

	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z"/><g><path d="M12 3v11a4 4 0 1 0-2 7c2 0 4-2 4-4V7h4V3h-6zm-2 16l-2-2 2-2 2 2-2 2z"/></g></svg>,

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
