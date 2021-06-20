/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { alignJustify as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Comment Content' ),
	description: __( 'Post Comment Content.' ),
	icon,
	edit,
	parent: [ 'core/post-comment' ],
};
