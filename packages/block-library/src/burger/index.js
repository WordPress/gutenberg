/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { columns as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Burger', 'block title' ),
	icon,
	description: __(
		'Create a block that wraps its children into a dropdown based on breakpoints'
	),
	edit,
	save,
};
