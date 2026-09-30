/**
 * Script module of the `wp_template_part` collection:
 * `@wordpress/core-fields/wp_template_part`.
 *
 * The data of each field is in its `field.php`, and `index.php` registers the
 * fields for template parts; the client reads them from the `wp/v2/fields`
 * route. What cannot be serialized (callbacks and components) is in the
 * `field.tsx` of the field: the client imports this module on demand and
 * merges each entry into the field with the same id.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as author } from './author/field';

const fields: FieldsScriptParts = {
	author,
};

export default fields;
