import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { MediaEdit } from '@wordpress/media-utils';
import type { SiteSettings } from '../types';

/**
 * The JavaScript parts of the site logo field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	Edit: MediaEdit,
	// A site without a logo stores `0`, not an empty value.
	setValue: ( { value } ) => ( {
		site_logo: ( value as number | undefined ) ?? 0,
	} ),
};
