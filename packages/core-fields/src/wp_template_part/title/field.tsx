import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { getItemTitle } from '../../shared/title/get-item-title';
import type { ItemWithTitle } from '../../shared/title/get-item-title';
import PatternTitleView from '../../shared/title/pattern-view';

/**
 * The JavaScript parts of the template part title field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< ItemWithTitle >[ string ] = {
	getValue: ( { item } ) => getItemTitle( item ),
	render: PatternTitleView,
};
