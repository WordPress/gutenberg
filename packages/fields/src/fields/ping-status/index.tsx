/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const pingStatusField: Field< BasePost > = {
	id: 'ping_status',
	label: __( 'Trackbacks & Pingbacks' ),
	type: 'text',
	Edit: 'radio',
	enableSorting: false,
	filterBy: false,
	elements: [
		{
			value: 'open',
			label: __( 'Allow' ),
			description: __( 'Allow link notifications from other blogs (pingbacks and trackbacks) on new articles.' ),
		},
		{
			value: 'closed',
			label: __( 'Don\'t allow' ),
			description: __(
				'Don\'t allow link notifications from other blogs (pingbacks and trackbacks) on new articles.'
			),
		},
	],
};

/**
 * Ping status field for BasePost.
 */
export default pingStatusField;