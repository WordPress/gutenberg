/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost, PostWithPageAttributesSupport } from '../types';

export const titleField: Field< BasePost, 'title' > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
};

export const orderField: Field< PostWithPageAttributesSupport, 'menu_order' > =
	{
		type: 'integer',
		id: 'menu_order',
		label: __( 'Order' ),
		description: __( 'Determines the order of pages.' ),
	};
