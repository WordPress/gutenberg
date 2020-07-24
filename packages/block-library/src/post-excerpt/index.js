/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postExcerpt as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Excerpt' ),
	description: __( 'Add the post excerpt of this post.' ),
	icon,
	edit,
};
