/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { comment as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Comment' ),
	description: __( 'Post Comment.' ),
	icon,
	edit,
	save,
};
