/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postFeaturedImage as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Featured Image' ),
	description: __( "Display a post's featured image." ),
	icon,
	edit,
};
