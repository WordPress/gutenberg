/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'core/description-term';

export const settings = {
	title: __( 'Description Term' ),
	parent: [ 'core/description-list' ],
	description: __( 'A term in a description list.' ),
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
			selector: 'dt',
			default: '',
		},
	},
};
