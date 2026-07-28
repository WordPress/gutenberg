/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import LastEditedDateView from './last-edited-date-view';

const lastEditedDateField: Field< BasePost > = {
	id: 'last_edited_date',
	type: 'datetime',
	label: __( 'Last edited' ),
	render: LastEditedDateView,
	getValue: ( { item } ) => item.modified,
	isVisible: ( item ) => !! item.modified,
	readOnly: true,
	enableHiding: false,
	enableSorting: false,
	filterBy: false,
};

/**
 * Last edited date field for BasePost.
 */
export default lastEditedDateField;
