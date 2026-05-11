/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const commentStatusField: Field< BasePost > = {
	id: 'comment_status',
	label: __( 'Comments' ),
	type: 'text',
	Edit: 'radio',
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	elements: [
		{
			value: 'open',
			label: __( 'Open' ),
			description: __( 'Visitors can add new comments and replies.' ),
		},
		{
			value: 'closed',
			label: __( 'Closed' ),
			description: __(
				'Visitors cannot add new comments or replies. Existing comments remain visible.'
			),
		},
	],
};

/**
 * Comment status field for BasePost.
 */
export default commentStatusField;
