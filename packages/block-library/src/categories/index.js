/**
 * WordPress dependencies
 */
import { category as icon } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Categories', 'block title' ),
	description: __( 'Display a list of all categories.' ),
	icon,
	example: {},
	edit,
};
