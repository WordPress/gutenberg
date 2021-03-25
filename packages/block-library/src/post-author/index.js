/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Author', 'block title' ),
	description: __( 'Add the author of this post.' ),
	icon,
	edit,
};
