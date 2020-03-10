/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'core/description-details';

export const settings = {
	title: __( 'Description Details' ),
	parent: [ 'core/description-details' ],
	description: __( 'The details of a term.' ),
	category: 'layout',
	supports: {
		className: false,
		lightBlockWrapper: true,
	},
	edit,
	save,
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'dd',
			default: '',
		},
	},
};
