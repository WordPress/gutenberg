import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { privateApis as mediaUtilsPrivateApis } from '@wordpress/media-utils';
import { unlock } from '../../lock-unlock';
import type { SiteSettings } from '../types';

const { MediaEdit } = unlock( mediaUtilsPrivateApis );

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
