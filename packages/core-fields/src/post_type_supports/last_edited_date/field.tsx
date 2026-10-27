import type { FieldsScriptParts } from '../../types';
import type { PostWithModified } from './types';
import LastEditedDateView from './view';

/**
 * The JavaScript parts of the last edited date field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithModified >[ string ] =
	{
		getValue: ( { item } ) => item.modified,
		isVisible: ( item ) => !! item.modified,
		render: LastEditedDateView,
	};
