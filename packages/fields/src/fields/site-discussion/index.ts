/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { SiteSettings } from '../../types';

const siteDiscussionField: Field< SiteSettings > = {
	id: 'default_comment_status',
	type: 'text',
	label: __( 'Discussion' ),
	Edit: 'radio',
	getValue: ( { item } ) => item.default_comment_status || '',
	setValue: ( { value } ) => ( {
		default_comment_status: value || null,
	} ),
	render: ( { item } ) => {
		return item.default_comment_status === 'open'
			? __( 'Comments open' )
			: __( 'Comments closed' );
	},
	elements: [
		{
			value: 'open',
			label: __( 'Open' ),
			description: __( 'Visitors can add new comments and replies.' ),
		},
		{
			value: '',
			label: __( 'Closed' ),
			description: __(
				'Visitors cannot add new comments or replies. Existing comments remain visible.'
			),
		},
	],
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Discussion field for the `root/site` entity.
 */
export default siteDiscussionField;
