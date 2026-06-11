/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import authorField from '../../fields/author';
import dateField from '../../fields/date';
import scheduledDateField from '../../fields/date/scheduled';
import discussionField from '../../fields/discussion';
import featuredImageField from '../../fields/featured-image';
import pageTitleField from '../../fields/page-title';
import parentField from '../../fields/parent';
import passwordField from '../../fields/password';
import postContentInfoField from '../../fields/post-content-info';
import slugField from '../../fields/slug';
import statusField from '../../fields/status';
import templateField from '../../fields/template';

/**
 * Non-serializable extensions for the `core/page-fields` field collection,
 * loaded on demand as the `@wordpress/fields/postType-page` script module. The
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
