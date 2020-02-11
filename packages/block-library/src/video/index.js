/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	title: __( 'Video' ),
	description: __(
		'Embed a video from your media library or upload a new one.'
	),
	icon,
	keywords: [ __( 'movie' ) ],
	transforms,
	supports: {
		align: true,
	},
	edit,
	save,
};
