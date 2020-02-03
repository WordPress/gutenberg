/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social links' ),
	description: __(
		'Create a block of links to your social media or external sites'
	),
	supports: {
		align: [ 'left', 'center', 'right' ],
	},
	example: {
		innerBlocks: [
			{
				name: 'core/social-link',
				attributes: {
					type: 'wordpress',
					url: 'https://wordpress.org',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					type: 'facebook',
					url: 'https://www.facebook.com/WordPress/',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					type: 'twitter',
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
	edit,
	save,
};
