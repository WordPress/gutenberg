import type { FieldsScriptParts } from '@wordpress/fields-loader';
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
