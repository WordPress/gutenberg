/**
 * Names for the post field a post-level suggestion targets, shown where a
 * block suggestion names its block: the note's target line, its accessible
 * name and the summary label.
 */
import { __, sprintf } from '@wordpress/i18n';
import type { SuggestionOperation } from './operations';

/**
 * Taxonomy names by `rest_base`, for a terms suggestion. Optional: without
 * one, a taxonomy's `rest_base` is shown as is.
 */
export type TaxonomyNames = Record< string, string >;

/**
 * The name of the post field an operation targets ("Post title",
 * "Excerpt", "Categories"...).
 *
 * @param op         A `post-attribute-set` operation.
 * @param taxonomies Taxonomy names by `rest_base`.
 * @return The field's name.
 */
export function getPostFieldName(
	op: SuggestionOperation | null | undefined,
	taxonomies: TaxonomyNames = {}
): string {
	switch ( op?.attribute ) {
		case 'title':
			return __( 'Post title' );
		case 'excerpt':
			return __( 'Excerpt' );
		case 'featured_media':
			return __( 'Featured image' );
		case 'slug':
			return __( 'Slug' );
		case 'meta':
			return sprintf(
				/* translators: %s: post meta key. */
				__( 'Post meta: %s' ),
				op.key ?? ''
			);
	}
	return taxonomies[ op?.attribute ] ?? String( op?.attribute ?? '' );
}

/**
 * The summary label for a post field operation ("Title:", "Excerpt:"...).
 *
 * @param op         A `post-attribute-set` operation.
 * @param taxonomies Taxonomy names by `rest_base`.
 * @return The label, ending in a colon.
 */
export function getPostFieldSummaryLabel(
	op: SuggestionOperation,
	taxonomies: TaxonomyNames = {}
): string {
	if ( op.attribute === 'title' ) {
		return __( 'Title:' );
	}
	// The note already says it is post meta; the summary names the key.
	if ( op.attribute === 'meta' ) {
		return sprintf(
			/* translators: %s: post meta key. */
			__( '%s:' ),
			op.key ?? ''
		);
	}
	return sprintf(
		/* translators: %s: post field name, e.g. "Excerpt". */
		__( '%s:' ),
		getPostFieldName( op, taxonomies )
	);
}
