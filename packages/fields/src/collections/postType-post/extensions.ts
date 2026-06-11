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
import excerptField from '../../fields/excerpt';
import featuredImageField from '../../fields/featured-image';
import formatField from '../../fields/format';
import passwordField from '../../fields/password';
import pingStatusField from '../../fields/ping-status';
import postContentInfoField from '../../fields/post-content-info';
import slugField from '../../fields/slug';
import statusField from '../../fields/status';
import stickyField from '../../fields/sticky';
import templateField from '../../fields/template';
import titleField from '../../fields/title';

/**
 * Non-serializable extensions for the `core/post-fields` field collection,
 * loaded on demand as the `@wordpress/fields/postType-post` script module. The
 * serializable parts of the field definitions live in the collocated
 * `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const postFieldExtensions: Partial< Field< any > >[] = [
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
		id: 'excerpt',
		description: excerptField.description,
		render: excerptField.render,
	},
	{
		id: 'ping_status',
		Edit: pingStatusField.Edit,
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
		id: 'format',
		getElements: formatField.getElements,
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
		id: 'sticky',
		isVisible: stickyField.isVisible,
	},
	{
		id: 'title',
		getValue: titleField.getValue,
		render: titleField.render,
	},
];

export default postFieldExtensions;
