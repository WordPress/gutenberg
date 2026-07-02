/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { PostsPage } from '../../types';

const postsPageTitleField: Field< PostsPage > = {
	id: 'posts_page_title',
	type: 'text',
	label: __( 'Blog title' ),
	description: __(
		'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
	),
	getValue: ( { item } ) => {
		const title = item.title;
		if ( typeof title === 'string' ) {
			return title;
		}
		return title?.raw ?? '';
	},
	setValue: ( { value } ) => ( { title: value } ),
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Title field for the posts page (the `page` assigned as `page_for_posts`).
 */
export default postsPageTitleField;
