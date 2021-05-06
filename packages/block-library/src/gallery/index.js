/**
 * WordPress dependencies
 */
import { gallery as icon } from '@wordpress/icons';

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
			columns: 2,
			images: [
				{
					url:
						'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
				},
				{
					url:
						'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg',
				},
			],
		},
	},
	transforms,
	edit,
	save,
	deprecated,
};
