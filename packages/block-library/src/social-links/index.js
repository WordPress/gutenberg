/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Social Icons', 'block title' ),
	description: __(
		'Display icons linking to your social media profiles or websites.'
	),
	keywords: [ _x( 'links', 'block keywords' ) ],
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
	styles: [
		{ name: 'default', label: __( 'Default' ), isDefault: true },
		{ name: 'logos-only', label: __( 'Logos Only' ) },
		{ name: 'pill-shape', label: __( 'Pill Shape' ) },
	],
	icon,
	edit,
	save,
};
