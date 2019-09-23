/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import { icon } from './icons';
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
				{ url: 'https://images.unsplash.com/photo-1506653291967-767803668ace' },
				{ url: 'https://images.unsplash.com/photo-1505764761634-1d77b57e1966' },
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
