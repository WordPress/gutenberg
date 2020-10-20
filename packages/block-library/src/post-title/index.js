/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postTitle as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Title' ),
	description: __( 'Add the title of your post.' ),
	icon,
	edit,
};
