/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { pageTitleField } from '@wordpress/fields';

/**
 * Page-specific overrides for the `core/page-fields` field collection, loaded
 * on demand as the `@wordpress/field-collections/postType-page` script module
 * and merged after `@wordpress/field-collections/postType-default` (see the
 * `gutenberg_field_collection_modules` filter in the collocated `fields.php`).
 *
 * The generic fields and their extensions come from the default collection;
 * only the title needs page-specific `getValue`/`render`, so this module
 * overrides just that field, leaving every other field served by the default
 * module untouched.
 */
const pageFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'title',
		getValue: pageTitleField.getValue,
		render: pageTitleField.render,
	},
];

export default pageFieldExtensions;
