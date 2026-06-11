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
import parentField from '../../fields/parent';
import passwordField from '../../fields/password';
import pingStatusField from '../../fields/ping-status';
import postContentInfoField from '../../fields/post-content-info';
import slugField from '../../fields/slug';
import statusField from '../../fields/status';
import stickyField from '../../fields/sticky';
import templateField from '../../fields/template';
import titleField from '../../fields/title';

/**
 * Non-serializable extensions shared by the dynamic `core/{post_type}-fields`
 * field collections — the collections registered server-side for every
 * REST-enabled post type without a hand-written collection — loaded on demand
 * as the `@wordpress/fields/postType-default` script module. The serializable
 * parts of the field definitions live in the collocated `fields.php`,
 * registered server-side via `gutenberg_register_field_collection()`.
 *
 * This is the union of every generic field's extensions. The client merge
 * matches extensions against the fields actually present in a collection by
 * field id, ignoring extension entries for fields a given collection does not
 * include — which is why this single module serves all post types.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const defaultFieldExtensions: Partial< Field< any > >[] = [
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
		id: 'parent',
		Edit: parentField.Edit,
		render: parentField.render,
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

export default defaultFieldExtensions;
