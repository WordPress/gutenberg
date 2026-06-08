/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Helper function to get the title of a post item.
 * This is duplicated from the `@wordpress/fields` package.
 * `packages/fields/src/actions/utils.ts`
 *
 * @param {Object} item The post item.
 * @return {string} The title of the item, or an empty string if the title is not found.
 */
export function getItemTitle( item ) {
	let title = '';
	if ( typeof item.title === 'string' ) {
		title = decodeEntities( item.title );
	} else if ( item.title && 'rendered' in item.title ) {
		title = decodeEntities( item.title.rendered );
	} else if ( item.title && 'raw' in item.title ) {
		title = decodeEntities( item.title.raw );
	}

	if ( title ) {
		return title;
	}

	let snippet = '';
	if ( item.excerpt ) {
		if ( typeof item.excerpt === 'string' ) {
			snippet = item.excerpt;
		} else if ( 'rendered' in item.excerpt ) {
			snippet = item.excerpt.rendered;
		} else if ( 'raw' in item.excerpt ) {
			snippet = item.excerpt.raw;
		}
	}

	if ( ! snippet && item.content ) {
		if ( typeof item.content === 'string' ) {
			snippet = item.content;
		} else if ( 'rendered' in item.content ) {
			snippet = item.content.rendered;
		} else if ( 'raw' in item.content ) {
			snippet = item.content.raw;
		}
	}

	if ( snippet ) {
		const plainText = decodeEntities(
			snippet.replace( /<[^>]+>/g, '' )
		).trim();
		const truncated = plainText.substring( 0, 40 );
		if ( truncated ) {
			const ellipsis = plainText.length > 40 ? '…' : '';
			return sprintf(
				/* translators: 1: Default no title text, 2: Post excerpt/content snippet */
				__( '%1$s - %2$s' ),
				__( '(no title)' ),
				truncated + ellipsis
			);
		}
	}

	return '';
}
