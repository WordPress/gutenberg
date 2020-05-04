/**
 * WordPress dependencies
 */
import { archive as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Archives' ),
	description: __( 'Display a monthly archive of your posts.' ),
	icon,
	supports: {
		align: true,
		html: false,
	},
	example: {},
	edit,
};
