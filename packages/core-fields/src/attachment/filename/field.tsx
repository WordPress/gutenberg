import { getFilename } from '@wordpress/url';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import type { MediaItem } from '../types';
import FileNameView from './view';

/**
 * The JavaScript parts of the file name field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => getFilename( item?.source_url || '' ),
	render: FileNameView,
};
