import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { MediaEdit } from '@wordpress/media-utils';
import type { SiteSettings } from '../types';

/**
 * The JavaScript parts of the site icon field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	Edit: MediaEdit,
	// A site without an icon stores `0`, not an empty value.
	setValue: ( { value } ) => ( {
		site_icon: ( value as number | undefined ) ?? 0,
	} ),
};
