/**
 * External dependencies
 */
import type * as Y from '@y/y';

/**
 * Walk a Y.Text's delta (produced with a DiffAttributionManager) and convert
 * it to an HTML string with suggestion markup:
 *
 * - Suggested insertions are wrapped in `<ins class="wp-suggestion-insert">`.
 * - Suggested deletions are wrapped in `<del class="wp-suggestion-delete">`.
 * - Unchanged content is output as-is.
 *
 * @param ytext The Y.Text to render.
 * @param am    The DiffAttributionManager providing attribution data.
 * @return HTML string with suggestion markup.
 */
export function yTextToSuggestionHTML(
	ytext: Y.Type,
	am: Y.DiffAttributionManager
): string {
	const delta = ytext.toDelta( am );
	const json = delta.toJSON();
	const children = json.children;

	if ( ! children || children.length === 0 ) {
		return '';
	}

	const parts: string[] = [];

	for ( const op of children ) {
		if ( 'insert' in op && typeof op.insert === 'string' ) {
			const text = op.insert;
			const attribution = op.attribution;

			if ( attribution && 'delete' in attribution ) {
				// Suggested deletion: text from currentDoc deleted in nextDoc.
				parts.push(
					`<del class="wp-suggestion-delete">${ text }</del>`
				);
			} else if ( attribution && 'insert' in attribution ) {
				// Suggested insertion: new text in nextDoc not in currentDoc.
				parts.push(
					`<ins class="wp-suggestion-insert">${ text }</ins>`
				);
			} else {
				// Unchanged content.
				parts.push( text );
			}
		}
		// Skip retain/delete/modify ops — they don't contribute to full-content rendering.
	}

	return parts.join( '' );
}

/**
 * Check whether a DiffAttributionManager has any pending suggestions
 * (insertions or deletions).
 *
 * @param am The DiffAttributionManager to check.
 * @return True if there are pending suggestions.
 */
export function hasSuggestions( am: Y.DiffAttributionManager ): boolean {
	// The inserts and deletes IdMaps are non-empty when there are suggestions.
	return (
		( am.inserts as any ).clients?.size > 0 ||
		( am.deletes as any ).clients?.size > 0
	);
}
