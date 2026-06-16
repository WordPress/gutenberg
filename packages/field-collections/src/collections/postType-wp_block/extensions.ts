/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import {
	passwordField,
	patternTitleField,
	slugField,
	statusField,
	templateField,
} from '@wordpress/fields';

/**
 * Non-serializable extensions for the `core/pattern-fields` field collection,
 * loaded on demand as the `@wordpress/field-collections/postType-wp_block` script module.
 * The serializable parts of the field definitions live in the collocated
 * `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const patternFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'status',
		elements: statusField.elements,
		render: statusField.render,
	},
	{
		id: 'slug',
		Edit: slugField.Edit,
		render: slugField.render,
	},
	{
		id: 'template',
		Edit: templateField.Edit,
		render: templateField.render,
	},
	{
		id: 'password',
		Edit: passwordField.Edit,
		isVisible: passwordField.isVisible,
	},
	{
		id: 'title',
		getValue: patternTitleField.getValue,
		render: patternTitleField.render,
	},
];

export default patternFieldExtensions;
