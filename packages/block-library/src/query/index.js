/**
 * WordPress dependencies
 */
import { loop as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	variations,
	deprecated,
};
