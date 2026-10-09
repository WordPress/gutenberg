import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { getItemTitle } from '../../shared/title/get-item-title';
import TitleView from '../../shared/title/view';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the title field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => getItemTitle( item ),
	render: TitleView,
};
