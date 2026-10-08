import { SUGGESTION_MARKER_CLASS } from '../constants';

/**
 * Opening tag of every `<mark>` element in a serialized document. Matching the
 * tag first, then its attributes, keeps the class and the id requirement tied
 * to the same element instead of to the document as a whole.
 */
const MARK_TAG_PATTERN = /<mark\b[^>]*>/gi;

/** Class attribute of an opening tag, captured so its tokens can be compared. */
const CLASS_ATTRIBUTE_PATTERN = /\sclass="([^"]*)"/i;

/** The id attribute every marker carries; see `buildSuggestionMarkerAttributes`. */
const SUGGESTION_ID_ATTRIBUTE_PATTERN = /\sdata-suggestion-id="/i;

/**
 * Whether serialized post content still carries an unresolved inline
 * suggestion marker.
 *
 * A marker is `<mark class="wp-suggestion" data-suggestion-id="…" …>`, so all
 * three parts are required: the element, the exact class *token* (not a
 * substring), and the id that links the marker to its suggestion. Testing the
 * whole document for the class alone would refuse the code editor over content
 * that has no suggestions in it at all — a `wp-suggestion-box` block class, a
 * code sample showing the markup (escaped, so the `<mark` never appears), or
 * prose naming the class — and there would be nothing for the author to accept
 * or reject to get the code editor back.
 *
 * Verbatim marker markup inside a Custom HTML block does count as a hit. That
 * content is indistinguishable from a real marker in serialized output, and it
 * is the conservative answer: refusing raw editing costs an edge case a menu
 * item, where allowing it risks the corruption the guard exists to prevent.
 *
 * Cheap on the common path: content without the class anywhere skips the scan.
 *
 * @param content Serialized post content.
 *
 * @return True when at least one pending marker is present.
 */
export function hasPendingSuggestionMarkers(
	content: string | undefined
): boolean {
	if ( ! content || ! content.includes( SUGGESTION_MARKER_CLASS ) ) {
		return false;
	}

	for ( const [ tag ] of content.matchAll( MARK_TAG_PATTERN ) ) {
		if ( ! SUGGESTION_ID_ATTRIBUTE_PATTERN.test( tag ) ) {
			continue;
		}
		const classNames = tag.match( CLASS_ATTRIBUTE_PATTERN )?.[ 1 ];
		if ( classNames?.split( /\s+/ ).includes( SUGGESTION_MARKER_CLASS ) ) {
			return true;
		}
	}

	return false;
}
