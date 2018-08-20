/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/block';

export const settings = {
	title: __( 'Reusable Block' ),

	category: 'reusable',

	description: __( 'When updated, content and formatting will change everywhere this Block is inserted.' ),

	attributes: {
		ref: {
			type: 'number',
		},
	},

	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},

	edit,

	save: () => null,
};
