/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mediaAndText as icon } from '@wordpress/icons';

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
			mediaType: 'image',
			mediaUrl:
				'https://s.w.org/images/core/5.3/Biologia_Centrali-Americana_-_Cantorchilus_semibadius_1902.jpg',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __(
						'The wren<br>Earns his living<br>Noiselessly.'
					),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: __( '— Kobayashi Issa (一茶)' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated,
};
