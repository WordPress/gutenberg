/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
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
	title: _x( 'Gallery', 'block title' ),
	description: __( 'Display multiple images in a rich gallery.' ),
	icon,
	keywords: [ __( 'images' ), __( 'photos' ) ],
	example: {
		attributes: {
			columns: 2,
			imageCount: 2,
		},
		innerBlocks: [
			{
				name: 'core/image',
				attributes: { url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg' },
			},
			{
				name: 'core/image',
				attributes: { url: 'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg' },
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated,
};
