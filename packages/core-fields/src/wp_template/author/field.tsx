import type { FieldsScriptParts } from '@wordpress/fields-loader';
import TemplateAuthorView from './view';
import { getAuthorElements } from './get-author-elements';
import type { Template } from './types';

/**
 * The JavaScript parts of the author field of templates; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< Template >[ string ] = {
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	getElements: () => getAuthorElements( 'wp_template' ),
};
