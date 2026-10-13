import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * The properties of an entity the title fields read.
 */
export interface ItemWithTitle {
	title?: string | { rendered?: string; raw?: string };
}

/**
 * A copy of `getItemTitle()` of `@wordpress/fields`: the decoded title of an
 * entity, whether the REST API returns it as a string or as `rendered` and
 * `raw`.
 *
 * @param item     The entity.
 * @param fallback The title of an entity without one.
 * @return The title.
 */
export function getItemTitle(
	item: ItemWithTitle,
	fallback: string = __( '(no title)' )
) {
	let title = '';
	if ( typeof item.title === 'string' ) {
		title = decodeEntities( item.title );
	} else if ( item.title && 'rendered' in item.title ) {
		title = decodeEntities( item.title.rendered ?? '' );
	} else if ( item.title && 'raw' in item.title ) {
		title = decodeEntities( item.title.raw ?? '' );
	}
	return title || fallback;
}
