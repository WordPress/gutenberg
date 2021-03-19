/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { postContent as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Content', 'block title' ),
	description: __( 'Displays the contents of a post or page.' ),
	icon,
	edit,
};
