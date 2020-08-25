/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Post Comment Content' ),
	description: __( 'Post Comment Content' ),
	edit,
	parent: [ 'core/post-comment' ],
};
