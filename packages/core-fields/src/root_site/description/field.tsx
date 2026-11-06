import { decodeEntities } from '@wordpress/html-entities';
import type { FieldsScriptParts } from '../../types';
import type { SiteSettings } from '../types';

/**
 * The JavaScript parts of the site tagline field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	getValue: ( { item } ) => decodeEntities( item.description ?? '' ),
};
