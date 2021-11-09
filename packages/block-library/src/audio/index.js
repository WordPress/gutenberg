/**
 * WordPress dependencies
 */
import { audio as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			src:
				'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg',
		},
	},
	transforms,
	deprecated,
	edit,
	save,
};
