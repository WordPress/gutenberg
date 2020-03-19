/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { archive as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/archives';

export const settings = {
	title: __( 'Archives' ),
	description: __( 'Display a monthly archive of your posts.' ),
	icon,
	category: 'widgets',
	supports: {
		align: true,
		html: false,
	},
	edit,
};
