/**
 * WordPress dependencies
 */
import { archive as icon } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Archives', 'block title' ),
	description: __( 'Display a monthly archive of your posts.' ),
	icon,
	example: {},
	edit,
};
