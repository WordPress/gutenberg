/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/tag-cloud';

export const settings = {
	title: __( 'Tag Cloud' ),
	description: __( 'A cloud of your most used tags.' ),
	icon: 'tag',
	category: 'widgets',
	supports: {
		html: false,
		align: true,
	},
	edit,
};
