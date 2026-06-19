/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { patternTitleField } from '@wordpress/fields';

/**
 * Pattern-specific overrides for the `core/wp_block-fields` field collection,
 * loaded on demand as the `@wordpress/field-collections/postType-wp_block`
 * script module and merged after
 * `@wordpress/field-collections/postType-default` (see the
 * `gutenberg_field_collection_modules` filter in the collocated `fields.php`).
 *
 * The generic fields and their extensions come from the default collection;
 * only the title needs pattern-specific `getValue`/`render`, so this module
 * overrides just that field, leaving every other field served by the default
 * module untouched.
 */
const patternFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'title',
		getValue: patternTitleField.getValue,
		render: patternTitleField.render,
	},
];

export default patternFieldExtensions;
