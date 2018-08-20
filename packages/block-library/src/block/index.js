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

    description: __( 'Use again in any Post -- changes sync. Convert to Regular Block to use as starter template.' ),

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
