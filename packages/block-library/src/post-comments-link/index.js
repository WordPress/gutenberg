/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import { postCommentsCount as icon } from '@wordpress/icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Comments Link', 'block title' ),
	description: __( 'Displays the link to the current post comments.' ),
	edit,
	icon,
};
