/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { comment as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),
	description: __( 'Display a list of your most recent comments.' ),
	icon,
	category: 'widgets',
	keywords: [ __( 'recent comments' ) ],
	supports: {
		align: true,
		html: false,
	},
	edit,
};
