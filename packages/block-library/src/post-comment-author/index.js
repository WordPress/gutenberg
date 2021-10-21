/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

/**
 * WordPress dependencies
 */
import { commentAuthor as icon } from '@wordpress/icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
};
