/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postComments as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Comments' ),
	description: __( "Display a post's comments." ),
	icon,
	edit,
};
