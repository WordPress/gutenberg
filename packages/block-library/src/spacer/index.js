/**
 * WordPress dependencies
 */
import { resizeCornerNE as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	deprecated,
	ignoreStylesInValidation: true,
};
