import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import TemplateAuthorView from './view';
import type { Template } from './types';

/**
 * The JavaScript parts of the author field of templates; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< Template >[ string ] = {
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	// The authors of the templates, deduplicated: several templates usually
	// come from the same theme or plugin.
	getElements: async () => {
		const records = ( await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{ per_page: -1, _fields: 'id,author_text' }
		) ) as Template[] | null;

		const seen = new Set< string >();
		const elements: { value: string; label: string }[] = [];
		for ( const record of records ?? [] ) {
			const value = record.author_text;
			if ( value && ! seen.has( value ) ) {
				seen.add( value );
				elements.push( { value, label: value } );
			}
		}
		return elements;
	},
};
