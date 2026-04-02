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

const blogTitleField: Field< BasePost > = {
	id: 'blog-title',
	type: 'text',
	label: __( 'Blog title' ),
	getValue: ( { item } ) => getItemTitle( item ),
	setValue: ( { value } ) => ( { title: value } ),
	description: __(
		'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
	),
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Blog title field for the posts page.
 */
export default blogTitleField;
