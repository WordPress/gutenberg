import type { FieldsScriptParts } from '@wordpress/fields-loader';
import TemplateAuthorView from '../../wp_template/author/view';
import { getAuthorElements } from '../../wp_template/author/get-author-elements';
import type { Template } from '../../wp_template/author/types';

/**
 * The JavaScript parts of the author field of template parts, which shares
 * the view of the author field of templates; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< Template >[ string ] = {
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	getElements: () => getAuthorElements( 'wp_template_part' ),
};
