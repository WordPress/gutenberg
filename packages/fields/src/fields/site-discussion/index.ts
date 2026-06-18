/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { HomeTemplateData } from '../../types';

const siteDiscussionField: Field< HomeTemplateData > = {
	id: 'default_comment_status',
	type: 'text',
	label: __( 'Discussion' ),
	Edit: 'radio',
	// The value lives in the `root/site` entity, merged into the form data under
	// the `root_site` namespace by the editor. Edits are routed back to that
	// entity by the editor.
	getValue: ( { item } ) => item.root_site?.default_comment_status || '',
	setValue: ( { value } ) => ( {
		root_site: { default_comment_status: value || null },
	} ),
	render: ( { item } ) => {
		return item.root_site?.default_comment_status === 'open'
			? __( 'Comments open' )
			: __( 'Comments closed' );
	},
	isVisible: ( item ) => [ 'home', 'index' ].includes( item.slug ?? '' ),
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
 * Site discussion field for the `home`/`index` template summary.
 */
export default siteDiscussionField;
