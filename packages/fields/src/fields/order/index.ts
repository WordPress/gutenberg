/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const orderField: Field< BasePost > = {
	id: 'menu_order',
	type: 'integer',
	label: __( 'Order' ),
	description: __( 'Determines the order of pages.' ),
	filterBy: false,
	isValid: {
		required: true,
	},
};

/**
 * Order field for BasePost.
 */
export default orderField;
