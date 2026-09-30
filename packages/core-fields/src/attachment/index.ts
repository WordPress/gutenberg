/**
 * Script module of the `attachment` collection:
 * `@wordpress/core-fields/attachment`.
 *
 * The data of each field is in its `field.php`, and `index.php` registers the
 * fields for attachments; the client reads them from the `wp/v2/fields`
 * route. What cannot be serialized (callbacks and components) is in the
 * `field.tsx` of the field: the client imports this module on demand and
 * merges each entry into the field with the same id.
 *
 * Only the fields with JavaScript parts need an entry. The date field is
 * plain data and has none.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as altText } from './alt_text/field';
import { fieldExtensions as caption } from './caption/field';
import { fieldExtensions as description } from './description/field';
import { fieldExtensions as filesize } from './filesize/field';
import { fieldExtensions as mediaDimensions } from './media_dimensions/field';
import { fieldExtensions as mimeType } from './mime_type/field';

const fields: FieldsScriptParts = {
	alt_text: altText,
	caption,
	description,
	filesize,
	media_dimensions: mediaDimensions,
	mime_type: mimeType,
};

export default fields;
