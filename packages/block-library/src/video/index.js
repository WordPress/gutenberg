/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { video as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Video', 'block title' ),
	description: __(
		'Embed a video from your media library or upload a new one.'
	),
	icon,
	keywords: [ __( 'movie' ) ],
	example: {
		attributes: {
			src:
				'https://upload.wikimedia.org/wikipedia/commons/c/ca/Wood_thrush_in_Central_Park_switch_sides_%2816510%29.webm',
			// translators: Caption accompanying a video of the wood thrush singing, which serves as an example for the Video block.
			caption: __( 'Wood thrush singing in Central Park, NYC.' ),
		},
	},
	transforms,
	edit,
	save,
};
