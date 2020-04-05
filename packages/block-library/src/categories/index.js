/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { category as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

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
