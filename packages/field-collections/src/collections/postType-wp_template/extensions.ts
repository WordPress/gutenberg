/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { templateTitleField } from '@wordpress/fields';

/**
 * Template-specific overrides for the `core/wp_template-fields` field
 * collection, loaded on demand as the
 * `@wordpress/field-collections/postType-wp_template` script module and merged
 * after `@wordpress/field-collections/postType-default` (see the
 * `gutenberg_field_collection_modules` filter in the collocated `fields.php`).
 *
 * The generic fields and their extensions come from the default collection;
 * only the title needs template-specific `getValue`/`render`, so this module
 * overrides just that field, leaving every other field served by the default
 * module untouched.
 */
const templateFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'title',
		getValue: templateTitleField.getValue,
		render: templateTitleField.render,
	},
];

export default templateFieldExtensions;
