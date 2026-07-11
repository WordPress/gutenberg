/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import StatusView from './status-view';
import STATUSES from './status-elements';

const OPERATOR_IS_ANY = 'isAny';

const statusField: Field< BasePost > = {
	label: __( 'Status' ),
	id: 'status',
	type: 'text',
	elements: STATUSES,
	// An auto-draft is a draft that hasn't been saved yet, so treat it as
	// one for display, selection, and filtering.
	getValue: ( { item } ) =>
		item.status === 'auto-draft' ? 'draft' : item.status,
	render: StatusView,
	Edit: 'radio',
	enableSorting: false,
	filterBy: {
		operators: [ OPERATOR_IS_ANY ],
	},
};

/**
 * Status field for BasePost.
 */
export default statusField;
