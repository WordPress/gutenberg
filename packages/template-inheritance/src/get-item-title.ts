import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * The decoded title of a template, whether the REST API returns it as a string
 * or as `rendered` and `raw`.
 *
 * @param item       The template.
 * @param item.title Its title.
 * @return The title.
 */
export function getItemTitle( item: {
	title?: string | { rendered?: string; raw?: string };
} ): string {
	let title = '';
	if ( typeof item.title === 'string' ) {
		title = item.title;
	} else if ( item.title?.rendered ) {
		title = item.title.rendered;
	} else if ( item.title?.raw ) {
		title = item.title.raw;
	}

	return decodeEntities( title ) || __( '(no title)' );
}
