/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../../types';

const scheduledDateField: Field< BasePost > = {
	id: 'scheduled_date',
	type: 'datetime',
	label: __( 'Scheduled Date' ),
	getValue: ( { item } ) => item.date,
	setValue: ( { value } ) => ( { date: value } ),
	isVisible: ( item ) => item.status === 'future',
	enableHiding: false,
	enableSorting: false,
	filterBy: false,
};

/**
 * ScheduledDate Field.
 */
export default scheduledDateField;
