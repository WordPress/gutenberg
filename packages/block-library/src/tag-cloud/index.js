/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { tag as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/tag-cloud';

export const settings = {
	title: __( 'Tag Cloud' ),
	description: __( 'A cloud of your most used tags.' ),
	icon,
	category: 'widgets',
	supports: {
		html: false,
		align: true,
	},
	edit,
};
