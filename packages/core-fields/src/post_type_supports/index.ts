/**
 * Script module of the `post_type_supports` collection:
 * `@wordpress/core-fields/post_type_supports`.
 *
 * The data of each field (id, type, label, filter operators…) is in its
 * `field.php`, and register_core_post_type_supports_fields() in `src/index.php`
 * registers the fields for the post types they apply to; the client reads them from the `wp/v2/fields` route. What cannot
 * be serialized (callbacks and components) is in the `field.tsx` of the
 * field: the client imports this module on demand and merges each entry into
 * the field with the same id.
 *
 * Only the fields with JavaScript parts need an entry. The comment status and
 * notes fields are plain data and have none.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as author } from './author/field';
import { fieldExtensions as discussion } from './discussion/field';
import { fieldExtensions as excerpt } from './excerpt/field';
import { fieldExtensions as lastEditedDate } from './last_edited_date/field';
import { fieldExtensions as pingStatus } from './ping_status/field';
import { fieldExtensions as postContentInfo } from './post_content_info/field';
import { fieldExtensions as sticky } from './sticky/field';

const fields: FieldsScriptParts = {
	author,
	discussion,
	excerpt,
	last_edited_date: lastEditedDate,
	ping_status: pingStatus,
	'post-content-info': postContentInfo,
	sticky,
};

export default fields;
