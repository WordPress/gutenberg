/**
 * Script module of the `wp_template` collection:
 * `@wordpress/core-fields/wp_template`.
 *
 * The data of each field is in its `field.php`, and `index.php` registers the
 * fields for templates; the client reads them from the `wp/v2/fields` route.
 * What cannot be serialized (callbacks and components) is in the `field.tsx`
 * of the field: the client imports this module on demand and merges each
 * entry into the field with the same id.
 *
 * It is a module of its own, apart from the `post_type_supports` one, because both
 * collections have an `author` field: the client merges the entries of a
 * module only into the fields registered with that module.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as author } from './author/field';
import { fieldExtensions as description } from './description/field';
import { fieldExtensions as title } from './title/field';

const fields: FieldsScriptParts = {
	author,
	description,
	title,
};

export default fields;
