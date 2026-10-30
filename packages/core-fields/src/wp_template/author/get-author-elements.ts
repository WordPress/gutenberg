import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Template } from './types';

/**
 * The authors of the templates or template parts, deduplicated: several of
 * them usually come from the same theme or plugin.
 *
 * @param postType `wp_template` or `wp_template_part`.
 * @return The elements to filter the author by.
 */
export async function getAuthorElements(
	postType: 'wp_template' | 'wp_template_part'
) {
	const records = ( await resolveSelect( coreStore ).getEntityRecords(
		'postType',
		postType,
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
}
