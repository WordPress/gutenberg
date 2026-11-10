import type { FieldsScriptParts } from '../../types';
import type { PostWithDate } from '../date/types';
import PublishDateView from './view';

/**
 * The JavaScript parts of the publish date field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithDate >[ string ] = {
	getValue: ( { item } ) => item.date,
	render: PublishDateView,
};
