/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import variations from './variations';

export const name = 'core/social-link';

export const settings = {
	title: __( 'Social Icon' ),
	category: 'widgets',
	parent: [ 'core/social-links' ],
	supports: {
		reusable: false,
		html: false,
	},
	edit,
	description: __( 'Create a link to the wider Web' ),
	attributes: {
		url: {
			type: 'string',
		},
		site: {
			type: 'string',
		},
		label: {
			type: 'string',
		},
	},
	variations,
};
