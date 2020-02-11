/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	title: __( 'Gallery' ),
	description: __( 'Display multiple images in a rich gallery.' ),
	icon,
	keywords: [ __( 'images' ), __( 'photos' ) ],
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
	supports: {
		align: true,
	},
	transforms,
	edit,
	save,
	deprecated,
};
