/**
 * WordPress dependencies
 */
import { category as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Categories' ),
	description: __( 'Display a list of all categories.' ),
	icon,
	supports: {
		align: true,
		html: false,
	},
	example: {},
	edit,
};
