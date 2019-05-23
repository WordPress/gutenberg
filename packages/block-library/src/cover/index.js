/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Cover' ),
	description: __( 'Add an image or video with a text overlay — great for headers.' ),
	icon,
	supports: {
		align: true,
	},
	transforms,
	save,
	edit,
	deprecated,
};
