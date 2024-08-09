/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost, PostWithPageAttributesSupport } from '../types';

export const titleField: Field< BasePost > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => item.title,
};

export const orderField: Field< PostWithPageAttributesSupport > = {
	type: 'integer',
	id: 'menu_order',
	label: __( 'Order' ),
	description: __( 'Determines the order of pages.' ),
};
