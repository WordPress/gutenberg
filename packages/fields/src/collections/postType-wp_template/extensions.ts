/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import authorField from '../../fields/author';
import passwordField from '../../fields/password';
import slugField from '../../fields/slug';
import statusField from '../../fields/status';
import templateField from '../../fields/template';
import templateTitleField from '../../fields/template-title';

/**
 * Non-serializable extensions for the `core/template-fields` field collection,
 * loaded on demand as the `@wordpress/fields/postType-wp_template` script
 * module. The serializable parts of the field definitions live in the
 * collocated `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const templateFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'author',
		getElements: authorField.getElements,
		setValue: authorField.setValue,
		render: authorField.render,
		sort: authorField.sort,
	},
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
		getValue: templateTitleField.getValue,
		render: templateTitleField.render,
	},
];

export default templateFieldExtensions;
