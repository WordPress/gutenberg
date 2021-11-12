/**
 * WordPress dependencies
 */
import { symbolFilled as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			area: 'primary',
		},
	},
	edit,
	save,
};
