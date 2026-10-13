import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { decodeEntities } from '@wordpress/html-entities';
import type { SiteSettings } from '../types';

/**
 * The JavaScript parts of the site tagline field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	getValue: ( { item } ) => decodeEntities( item.description ?? '' ),
};
