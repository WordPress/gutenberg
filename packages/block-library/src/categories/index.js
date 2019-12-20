/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/categories';

export const settings = {
	title: __( 'Categories' ),
	description: __( 'Display a list of all categories.' ),
	icon,
	category: 'widgets',
	supports: {
		align: true,
		html: false,
	},
	edit,
};
