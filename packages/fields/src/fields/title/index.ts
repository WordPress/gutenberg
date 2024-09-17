/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getItemTitle } from '../../actions/utils';

const titleField: Field< BasePost > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => getItemTitle( item ),
};

export default titleField;
