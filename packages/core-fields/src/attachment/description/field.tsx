import type { FieldsScriptParts } from '../../types';
import { getRawContent } from '../get-raw-content';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the description field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => getRawContent( item?.description ),
	render: ( { item } ) => (
		<div>{ getRawContent( item?.description ) || '-' }</div>
	),
};
