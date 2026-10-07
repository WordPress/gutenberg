import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { searchItems } = unlock( blockEditorPrivateApis );

/**
 * Filters a template list given a search term.
 *
 * @param {Array}  templates   Item list
 * @param {string} searchValue Search input.
 *
 * @return {Array} Filtered template list.
 */
export function searchTemplates( templates = [], searchValue = '' ) {
	return searchItems( templates, searchValue, {
		fields: [ { get: ( template ) => template.title } ],
	} );
}
