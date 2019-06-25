/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './tranforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Video' ),
	description: __( 'Embed a video from your media library or upload a new one.' ),
	icon,
	keywords: [ __( 'movie' ) ],
	transforms,
	supports: {
		align: true,
	},
	edit,
	save,
};
