/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import NavMenuBlock from './block';

export const name = 'core/navigation-menu';

export const settings = {
	title: __( 'Navigation Menu' ),

	description: __( 'Show a list of menu items.' ),

	icon: 'menu',

	category: 'widgets',

	keywords: [ __( 'navigation menu' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: NavMenuBlock,

	save() {
		return null;
	},
};
