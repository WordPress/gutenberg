/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getItemTitle } from '../../actions/utils';
import PageTitleView from '../../fields/page-title/view';

/**
 * Non-serializable extensions for the `core/page-fields` field collection,
 * loaded on demand as the `@wordpress/fields/postType-page` script module. The
 * serializable parts of the field definitions live in the collocated
 * `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 */
const pageFieldExtensions: Partial< Field< BasePost > >[] = [
	{
		id: 'title',
		getValue: ( { item } ) => getItemTitle( item ),
		render: PageTitleView,
	},
];

export default pageFieldExtensions;
