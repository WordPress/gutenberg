/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Navigation' ),

	icon,

	description: __( 'Add a navigation block to your site.' ),

	keywords: [ __( 'menu' ), __( 'navigation' ), __( 'links' ) ],

	variations: [
		{
			name: 'horizontal',
			isDefault: true,
			title: __( 'Navigation (horizontal)' ),
			description: __( 'Links shown in a row.' ),
			attributes: { orientation: 'horizontal' },
		},
		{
			name: 'vertical',
			title: __( 'Navigation (vertical)' ),
			description: __( 'Links shown in a column.' ),
			attributes: { orientation: 'vertical' },
		},
	],

	example: {
		innerBlocks: [
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Home' as in a website's home page.
					label: __( 'Home' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'About' as in a website's about page.
					label: __( 'About' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Contact' as in a website's contact page.
					label: __( 'Contact' ),
					url: 'https://make.wordpress.org/',
				},
			},
		],
	},

	styles: [
		{ name: 'light', label: __( 'Light' ), isDefault: true },
		{ name: 'dark', label: __( 'Dark' ) },
	],

	edit,

	save,

	deprecated,
};
