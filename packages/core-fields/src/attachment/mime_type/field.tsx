import type { FieldsScriptParts } from '../../types';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the file type field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => item?.mime_type || '',
	render: ( { item } ) => item?.mime_type || '-',
};
