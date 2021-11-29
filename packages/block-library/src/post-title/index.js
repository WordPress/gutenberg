/**
 * WordPress dependencies
 */
import { postTitle as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
};
