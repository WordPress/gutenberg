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
	title: __( 'Post Categories' ),
	description: __('Display a list of categories for this post.'),
	icon,
	supports: {
		align: true,
	},
	edit,
};
