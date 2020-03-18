/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/search';

export const settings = {
	title: __( 'Search' ),
	description: __( 'Help visitors find your content.' ),
	icon,
	category: 'widgets',
	keywords: [ __( 'find' ) ],
	supports: {
		align: true,
	},
	example: {},
	edit,
};
