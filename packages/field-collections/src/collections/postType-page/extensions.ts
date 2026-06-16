/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import {
	authorField,
	dateField,
	scheduledDateField,
	discussionField,
	featuredImageField,
	pageTitleField,
	parentField,
	passwordField,
	postContentInfoField,
	slugField,
	statusField,
	templateField,
} from '@wordpress/fields';

/**
 * Non-serializable extensions for the `core/page-fields` field collection,
 * loaded on demand as the `@wordpress/field-collections/postType-page` script module. The
 * serializable parts of the field definitions live in the collocated
 * `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const pageFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'featured_media',
		Edit: featuredImageField.Edit,
		render: featuredImageField.render,
		setValue: featuredImageField.setValue,
	},
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
		id: 'date',
		render: dateField.render,
	},
	{
		id: 'scheduled_date',
		getValue: scheduledDateField.getValue,
		setValue: scheduledDateField.setValue,
		isVisible: scheduledDateField.isVisible,
	},
	{
		id: 'slug',
		Edit: slugField.Edit,
		render: slugField.render,
	},
	{
		id: 'parent',
		Edit: parentField.Edit,
		render: parentField.render,
	},
	{
		id: 'discussion',
		render: discussionField.render,
	},
	{
		id: 'template',
		Edit: templateField.Edit,
		render: templateField.render,
	},
	{
		id: 'post-content-info',
		render: postContentInfoField.render,
	},
	{
		id: 'password',
		Edit: passwordField.Edit,
		isVisible: passwordField.isVisible,
	},
	{
		id: 'title',
		getValue: pageTitleField.getValue,
		render: pageTitleField.render,
	},
];

export default pageFieldExtensions;
