/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { buttons as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import transforms from './transforms';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/button',
				attributes: { text: __( 'Find out more' ) },
			},
			{
				name: 'core/button',
				attributes: { text: __( 'Contact us' ) },
			},
		],
	},
	deprecated,
	transforms,
	edit,
	save,
	variations,
};
