/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

export function getTitleWithFallbackName( post: BasePost ) {
	if (
		typeof post.title === 'object' &&
		'rendered' in post.title &&
		post.title.rendered
	) {
		return decodeEntities( post.title.rendered );
	}

	let snippet = '';
	if (
		post.excerpt &&
		typeof post.excerpt === 'object' &&
		'rendered' in post.excerpt
	) {
		snippet = post.excerpt.rendered || '';
	} else if (
		post.content &&
		typeof post.content === 'object' &&
		'rendered' in post.content
	) {
		snippet = post.content.rendered || '';
	}

	const fallback = `#${ post?.id || '' } (${ __( 'no title' ) })`.trim();

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
				fallback,
				truncated + ellipsis
			);
		}
	}

	return fallback;
}
