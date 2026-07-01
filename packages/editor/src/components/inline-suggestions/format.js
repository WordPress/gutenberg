/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import {
	registerFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { findMarkerRange, findMarkerText } from '../inline-markers';

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

export const SUGGESTION_A11Y_FORMAT_NAME = 'core/suggestion-a11y';

/**
 * Editor-only decoration pass that gives suggestion markers screen-reader
 * semantics. A bare `<mark class="wp-suggestion">` is invisible to assistive
 * technology — a suggested deletion reads as normal text. For each rich-text
 * run covered by a `core/suggestion` format, nest a `core/suggestion-a11y`
 * format carrying `role="insertion"` (add markers) or `role="deletion"` (del
 * markers), which ARIA maps to `<ins>`/`<del>` semantics.
 *
 * The role must never serialize into post content, so it cannot live on the
 * marker format itself (reading the editable DOM back would absorb it). It is
 * applied here, at editable-tree preparation time only: formats added by a
 * `__experimentalCreatePrepareEditableTree` handler render into the editable
 * DOM but are ignored when the DOM is parsed back into a value (see
 * `toFormat` in `@wordpress/rich-text`), exactly like `core/annotation`.
 *
 * One decoration object is reused across each contiguous marker run
 * (rich-text merges adjacent identical format references into a single
 * element), so a marker gains exactly one nested role element.
 *
 * @param {Array} formats Per-character format stacks.
 * @return {Array} Format stacks with role decorations added.
 */
export function addSuggestionRoleFormats( formats ) {
	if ( ! formats || formats.length === 0 ) {
		return formats;
	}
	let out = null;
	let lastSuggestion = null;
	let lastDecoration = null;
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		const suggestion = Array.isArray( stack )
			? stack.find( ( f ) => f.type === SUGGESTION_FORMAT_NAME )
			: undefined;
		if ( ! suggestion ) {
			lastSuggestion = null;
			lastDecoration = null;
			continue;
		}
		if ( ! out ) {
			out = formats.slice();
		}
		if ( suggestion !== lastSuggestion ) {
			lastSuggestion = suggestion;
			lastDecoration = {
				type: SUGGESTION_A11Y_FORMAT_NAME,
				attributes: {
					role:
						suggestion.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] ===
						SUGGESTION_TYPE_ADDITION
							? 'insertion'
							: 'deletion',
				},
			};
		}
		out[ i ] = [ ...stack, lastDecoration ];
	}
	return out ?? formats;
}

/**
 * Editor-only rich-text format that renders the screen-reader role element
 * inside a suggestion marker. Never parsed back into values (it declares
 * `__experimentalCreatePrepareEditableTree` without a change handler, which
 * `toFormat` treats as editor-only), so the role never reaches post content.
 */
export const suggestionA11yFormat = {
	title: __( 'Suggestion accessibility decoration' ),
	tagName: 'span',
	className: 'wp-suggestion-a11y',
	attributes: {
		role: 'role',
	},
	interactive: false,
	edit: () => null,
	__experimentalCreatePrepareEditableTree: () => addSuggestionRoleFormats,
};

/**
 * Idempotently register the `core/suggestion` marker format so rich-text can
 * round-trip a suggestion `<mark>` in block content and the annotations API can
 * decorate it. Guarded against duplicate registration (HMR, repeated editor
 * bootstrap, tests) the same way `core/note` is registered. Also registers the
 * editor-only `core/suggestion-a11y` decoration format that gives markers
 * screen-reader `role="insertion"`/`role="deletion"` semantics at render time.
 *
 * The format itself is generic (inert `edit`); a consumer that owns the
 * suggesting UI — i.e. suggest mode — passes its own `edit` so the
 * marker-creating toolbar control lives with the feature, not the primitive.
 *
 * @param {Function} [edit] Optional rich-text format `edit` component.
 */
export function registerSuggestionFormat( edit ) {
	if (
		! select( richTextStore ).getFormatType( SUGGESTION_A11Y_FORMAT_NAME )
	) {
		registerFormatType( SUGGESTION_A11Y_FORMAT_NAME, suggestionA11yFormat );
	}
	if ( select( richTextStore ).getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		return;
	}
	registerFormatType(
		SUGGESTION_FORMAT_NAME,
		edit ? { ...suggestionFormat, edit } : suggestionFormat
	);
}

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

/**
 * Resolve the visible text wrapped by a suggestion marker, by id, deriving it
 * from the in-content marker on every read. Used to summarize what an inline
 * suggestion proposes to add or remove (e.g. `Add: "new text"` in the sidebar)
 * without storing the text in the suggestion payload.
 *
 * @param {*}             value Block attribute value (RichTextData, string, or other).
 * @param {number|string} id    Suggestion id to search for.
 * @return {string} The marked text, or '' when no marker is found.
 */
export function findSuggestionText( value, id ) {
	return findMarkerText( value, {
		formatType: SUGGESTION_FORMAT_NAME,
		idAttribute: SUGGESTION_ID_ATTRIBUTE,
		id,
		quickReject: SUGGESTION_CLASS,
	} );
}
