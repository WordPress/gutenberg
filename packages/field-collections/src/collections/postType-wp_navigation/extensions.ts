/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import {
	passwordField,
	slugField,
	statusField,
	templateField,
	titleField,
} from '@wordpress/fields';

/**
 * Non-serializable extensions for the `core/navigation-fields` field
 * collection, loaded on demand as the
 * `@wordpress/field-collections/postType-wp_navigation` script module. The serializable
 * parts of the field definitions live in the collocated `fields.php`,
 * registered server-side via `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const navigationFieldExtensions: Partial< Field< any > >[] = [
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
		getValue: titleField.getValue,
		render: titleField.render,
	},
];

export default navigationFieldExtensions;
