/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { postTitle as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Title', 'block title' ),
	description: __( 'Add the title of your post.' ),
	icon,
	edit,
};
