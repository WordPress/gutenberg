/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import DateView from './date-view';

const dateField: Field< BasePost > = {
	id: 'date',
	type: 'datetime',
	label: __( 'Date' ),
	render: DateView,
	filterBy: {
		operators: [ 'before', 'after' ],
	},
};

/**
 * Date field for BasePost.
 */
export default dateField;
