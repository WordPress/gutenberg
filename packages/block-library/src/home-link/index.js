/**
 * WordPress dependencies
 */
import { home } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: home,

	edit,

	save,

	example: {
		attributes: {},
	},
};
