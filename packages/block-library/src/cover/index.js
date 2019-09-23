/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Cover' ),
	description: __( 'Add an image or video with a text overlay — great for headers.' ),
	icon,
	supports: {
		align: true,
	},
	example: {
		attributes: {
			customOverlayColor: '#065174',
			dimRatio: 40,
			url: 'https://images.unsplash.com/photo-1549880339-d93e3072aef4',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					customFontSize: 48,
					content: __( 'Snow Patrol' ),
					align: 'center',
				},
			},
		],
	},
	transforms,
	save,
	edit,
	deprecated,
};
