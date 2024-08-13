/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../types';
import { getItemTitle } from '../actions/utils';

export const titleField: Field< BasePost > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => getItemTitle( item ),
};

export const orderField: Field< BasePost > = {
	type: 'integer',
	id: 'menu_order',
	label: __( 'Order' ),
	description: __( 'Determines the order of pages.' ),
};
