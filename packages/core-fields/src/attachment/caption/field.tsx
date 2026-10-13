import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { getRawContent } from '../get-raw-content';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the caption field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => getRawContent( item?.caption ),
	render: ( { item } ) => getRawContent( item?.caption ) || '-',
};
