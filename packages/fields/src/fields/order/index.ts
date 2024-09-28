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
	type: 'integer',
	id: 'menu_order',
	label: __( 'Order' ),
	description: __( 'Determines the order of pages.' ),
};

export default orderField;
