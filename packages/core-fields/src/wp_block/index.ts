/**
 * Script module of the `wp_block` collection:
 * `@wordpress/core-fields/wp_block`.
 *
 * The data of each field is in its `field.php`; the client merges these
 * JavaScript parts into fields registered with this module.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as description } from './description/field';
import { fieldExtensions as syncStatus } from './sync_status/field';
import { fieldExtensions as title } from './title/field';

const fields: FieldsScriptParts = {
	excerpt: description,
	'sync-status': syncStatus,
	title,
};

export default fields;
