/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import {
	altTextField,
	attachedToField,
	authorField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
} from '@wordpress/media-fields';
import { titleField } from '@wordpress/fields';

/**
 * Non-serializable extensions for the `core/media-fields` field collection,
 * loaded on demand as the `@wordpress/field-collections/postType-attachment` script
 * module. The serializable parts of the field definitions live in the
 * collocated `fields.php`, registered server-side via
 * `gutenberg_register_field_collection()`.
 *
 * Each extension picks the non-serializable members (getValue, render, Edit,
 * elements carrying icons…) from the canonical field definition, so they
 * cannot drift from the fields registered for other post types.
 */
const attachmentFieldExtensions: Partial< Field< any > >[] = [
	{
		id: 'author',
		getElements: authorField.getElements,
		render: authorField.render,
		sort: authorField.sort,
	},
	{
		id: 'filename',
		getValue: filenameField.getValue,
		render: filenameField.render,
	},
	{
		id: 'mime_type',
		getValue: mimeTypeField.getValue,
		render: mimeTypeField.render,
	},
	{
		id: 'filesize',
		getValue: filesizeField.getValue,
		isVisible: filesizeField.isVisible,
	},
	{
		id: 'media_dimensions',
		getValue: mediaDimensionsField.getValue,
		isVisible: mediaDimensionsField.isVisible,
	},
	{
		id: 'attached_to',
		Edit: attachedToField.Edit,
		render: attachedToField.render,
	},
	{
		id: 'title',
		getValue: titleField.getValue,
		render: titleField.render,
	},
	{
		id: 'alt_text',
		isVisible: altTextField.isVisible,
		render: altTextField.render,
		Edit: altTextField.Edit,
	},
	{
		id: 'caption',
		getValue: captionField.getValue,
		render: captionField.render,
		Edit: captionField.Edit,
	},
	{
		id: 'description',
		getValue: descriptionField.getValue,
		render: descriptionField.render,
		Edit: descriptionField.Edit,
	},
];

export default attachmentFieldExtensions;
