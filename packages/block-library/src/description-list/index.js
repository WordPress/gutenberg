/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'core/description-list';

export const settings = {
	title: __( 'Description List' ),
	description: __( 'List groups of terms and descriptions.' ),
	keywords: [ __( 'list' ), __( 'definitions' ), __( 'terms' ) ],
	category: 'layout',
	supports: {
		className: false,
		lightBlockWrapper: true,
	},
	edit,
	save,
};
