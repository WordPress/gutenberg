/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import deprecated from './deprecated';

/**
 * WordPress dependencies
 */
import { queryTitle as icon } from '@wordpress/icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	variations,
	deprecated,
};
