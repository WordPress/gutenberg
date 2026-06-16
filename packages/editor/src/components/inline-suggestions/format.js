/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { findMarkerRange } from '../inline-markers';

export const SUGGESTION_FORMAT_NAME = 'core/suggestion';

/**
 * Exact class token on a suggestion `<mark>`. Kept distinct from `wp-note` (and
 * from any user/`core/text-color` `<mark>`) so the PHP strip and CSS only ever
 * touch suggestion markers.
 */
export const SUGGESTION_CLASS = 'wp-suggestion';

/**
 * Annotation source for suggestion decoration. The annotations API turns this
 * into an `annotation-text-core-suggestion` class on the rendered `<mark>`,
 * independent of Notes' `annotation-text-core-note`.
 */
export const SUGGESTION_ANNOTATION_SOURCE = 'core-suggestion';

export const SUGGESTION_ID_ATTRIBUTE = 'data-suggestion-id';
export const SUGGESTION_TYPE_ATTRIBUTE = 'data-suggestion-type';
export const SUGGESTION_AUTHOR_ATTRIBUTE = 'data-author';

/**
 * Suggested for deletion: the wrapped text already exists and is proposed for
 * removal. Rendered output strips the wrapper but keeps the text until accepted.
 */
export const SUGGESTION_TYPE_DELETION = 'del';

/**
 * Suggested for addition: the wrapped text is proposed new content. Rendered
 * output strips the wrapper *and* the text until accepted.
 */
export const SUGGESTION_TYPE_ADDITION = 'add';

/**
 * Rich-text format for an inline suggestion marker. Serializes as
 * `<mark class="wp-suggestion" data-suggestion-id data-suggestion-type data-author>`.
 *
 * The `edit` component is intentionally inert here: suggestion markers are
 * created by the suggest-mode "suggest delete/add" actions (a later phase), not
 * from a generic rich-text toolbar entry. Registering the format is what lets
 * rich-text round-trip the marker and the annotations API decorate it.
 */
export const suggestionFormat = {
	title: __( 'Suggestion' ),
	tagName: 'mark',
	className: SUGGESTION_CLASS,
	attributes: {
		[ SUGGESTION_ID_ATTRIBUTE ]: SUGGESTION_ID_ATTRIBUTE,
		[ SUGGESTION_TYPE_ATTRIBUTE ]: SUGGESTION_TYPE_ATTRIBUTE,
		[ SUGGESTION_AUTHOR_ATTRIBUTE ]: SUGGESTION_AUTHOR_ATTRIBUTE,
	},
	edit: () => null,
};

/**
 * Resolve a suggestion marker's live character range in a rich-text value by
 * id, deriving the position from the in-content marker on every read.
 *
 * @param {*}             value Block attribute value (RichTextData, string, or other).
 * @param {number|string} id    Suggestion id to search for.
 * @return {?{start: number, end: number}} Range or null when no marker is found.
 */
export function findSuggestionRange( value, id ) {
	return findMarkerRange( value, {
		formatType: SUGGESTION_FORMAT_NAME,
		idAttribute: SUGGESTION_ID_ATTRIBUTE,
		id,
		quickReject: SUGGESTION_CLASS,
	} );
}
