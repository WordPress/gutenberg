/**
 * WordPress dependencies
 */
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	example: {
		innerBlocks: [
			{
				name: 'core/social-link',
				attributes: {
					service: 'wordpress',
					url: 'https://wordpress.org',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					service: 'facebook',
					url: 'https://www.facebook.com/WordPress/',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					service: 'twitter',
					url: 'https://twitter.com/WordPress',
				},
			},
		],
	},
	icon,
	edit,
	save,
	deprecated,
};
