/**
 * Script module of the `root_site` collection:
 * `@wordpress/core-fields/root_site`.
 *
 * The data of each field is in its `field.php`, and `index.php` registers the
 * fields for the site; the client reads them from the `wp/v2/fields` route.
 * What cannot be serialized (callbacks and components) is in the `field.tsx`
 * of the field: the client imports this module on demand and merges each
 * entry into the field with the same id.
 */

import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { fieldExtensions as description } from './description/field';
import { fieldExtensions as siteIcon } from './site_icon/field';
import { fieldExtensions as siteLogo } from './site_logo/field';
import { fieldExtensions as title } from './title/field';

const fields: FieldsScriptParts = {
	description,
	site_icon: siteIcon,
	site_logo: siteLogo,
	title,
};

export default fields;
