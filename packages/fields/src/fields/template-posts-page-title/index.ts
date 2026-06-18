/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { HomeTemplateData } from '../../types';

const templatePostsPageTitleField: Field< HomeTemplateData > = {
	id: 'posttype_page_title',
	type: 'text',
	label: __( 'Blog title' ),
	description: __(
		'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
	),
	// This proxies the title of the posts page (the `page` assigned as
	// `page_for_posts`), not the template entity. The page record is merged into
	// the form data under the `posttype_page` namespace by the editor, and edits
	// are routed back to that entity.
	getValue: ( { item } ) => {
		const title = item.posttype_page?.title;
		if ( typeof title === 'string' ) {
			return title;
		}
		return title?.raw ?? '';
	},
	setValue: ( { value } ) => ( { posttype_page: { title: value } } ),
	isVisible: ( item ) =>
		[ 'home', 'index' ].includes( item.slug ?? '' ) &&
		!! item.posttype_page,
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Posts page title field for the `home`/`index` template summary.
 */
export default templatePostsPageTitleField;
