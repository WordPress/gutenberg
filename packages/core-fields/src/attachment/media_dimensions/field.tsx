import { _x, sprintf } from '@wordpress/i18n';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the dimensions field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) =>
		item?.media_details?.width && item?.media_details?.height
			? sprintf(
					// translators: 1: Width. 2: Height.
					_x( '%1$s × %2$s', 'image dimensions' ),
					item.media_details.width.toString(),
					item.media_details.height.toString()
				)
			: '',
	isVisible: ( item ) =>
		!! ( item?.media_details?.width && item?.media_details?.height ),
};
