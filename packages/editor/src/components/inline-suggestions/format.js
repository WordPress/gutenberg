import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import {
	registerFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import {
	findMarkerRange,
	findMarkerText,
	getMarkerSelector,
} from '../inline-markers';

export const SUGGESTION_FORMAT_NAME = 'core/suggestion';

/**
 * Exact class token on a suggestion `<mark>`. Kept distinct from `wp-note` (and
 * from any user/`core/text-color` `<mark>`) so the PHP strip and CSS only ever
 * touch suggestion markers.
 *
 * Mirrored as `SUGGESTION_MARKER_CLASS` in `store/constants.ts`, which the
 * store reads saved content back with and cannot import from here. Those two
 * are the only copies; keep them in step.
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
 * Suggested formatting change: the wrapped run's *text* is unchanged, but its
 * formatting (bold/italic/link/...) is proposed to change. The marked run holds
 * the proposed formatting so the editor shows it in place (single run, no
 * duplicated text — the Google Docs model); the original run is recorded on the
 * suggestion note so a reject can restore it. Rendered output strips the wrapper
 * and keeps the text (same as a deletion: the words are already public, only
 * their styling is proposed).
 */
export const SUGGESTION_TYPE_FORMAT = 'format';

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

export const SUGGESTION_A11Y_START_ATTRIBUTE = 'data-suggestion-a11y-start';
export const SUGGESTION_A11Y_END_ATTRIBUTE = 'data-suggestion-a11y-end';

/**
 * Screen-reader announcements that bracket a marker of a given type, plus the
 * ARIA role that matches it. `insertion` and `deletion` are the only two roles
 * that fit: a formatting suggestion changes neither the presence nor the
 * absence of the run, so announcing it as a deletion would tell a
 * screen-reader user the words are slated for removal when they are not.
 *
 * The bracketing text is what carries the meaning. `role="insertion"` /
 * `role="deletion"` map to `<ins>`/`<del>`, which most screen readers do not
 * announce by default, and both roles prohibit an accessible name — so the
 * "who and what" has to be rendered, not labelled. It is painted as CSS
 * generated content off these attributes (see `content-suggestion.scss`), which
 * keeps it out of the DOM: inside a `contenteditable` any real text node would
 * be reachable by the caret and picked up by copy.
 *
 * @param {?string} type Marker `data-suggestion-type` value.
 * @return {{start: string, end: string, role: ?string}} Announcement pair and role.
 */
export function getSuggestionA11yDescriptor( type ) {
	switch ( type ) {
		case SUGGESTION_TYPE_ADDITION:
			return {
				start: __( 'Start of suggested addition.' ),
				end: __( 'End of suggested addition.' ),
				role: 'insertion',
			};
		case SUGGESTION_TYPE_DELETION:
			return {
				start: __( 'Start of suggested deletion.' ),
				end: __( 'End of suggested deletion.' ),
				role: 'deletion',
			};
		case SUGGESTION_TYPE_FORMAT:
			return {
				start: __( 'Start of suggested formatting change.' ),
				end: __( 'End of suggested formatting change.' ),
				role: null,
			};
		default:
			return {
				start: __( 'Start of suggested change.' ),
				end: __( 'End of suggested change.' ),
				role: null,
			};
	}
}

/**
 * Editor-only decoration pass that gives suggestion markers screen-reader
 * semantics. A bare `<mark class="wp-suggestion">` is invisible to assistive
 * technology — a suggested deletion reads as normal text. For each rich-text
 * run covered by a `core/suggestion` format, nest a `core/suggestion-a11y`
 * format carrying the bracketing announcements for its type and, where one
 * applies, `role="insertion"` (add markers) or `role="deletion"` (del markers),
 * which ARIA maps to `<ins>`/`<del>` semantics.
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
 * element), so a marker gains exactly one nested role element. Where markers
 * nest, each run keeps its own decoration describing the marker that wraps it.
 *
 * It is spliced in directly after the marker rather than pushed onto the end of
 * the stack. `toTree` decides whether to reuse an element by comparing format
 * stacks *by index*, so a bold run or link covering only part of a marker would
 * shift a trailing decoration's index and split it into two elements - and two
 * elements means the closing announcement is read out mid-suggestion and the
 * opening one repeated. Sitting immediately inside the marker keeps its index
 * fixed for the marker's whole run.
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
		/*
		 * The innermost marker, not the first: overlapping runs from two
		 * people serialize as nested markers, and the decoration goes just
		 * inside the deepest of them. Describing an enclosing marker would
		 * announce the wrong change - a deletion nested inside someone else's
		 * addition read aloud as an addition.
		 */
		const markerIndex = Array.isArray( stack )
			? stack.findLastIndex( ( f ) => f.type === SUGGESTION_FORMAT_NAME )
			: -1;
		if ( markerIndex === -1 ) {
			lastSuggestion = null;
			lastDecoration = null;
			continue;
		}
		const suggestion = stack[ markerIndex ];
		if ( ! out ) {
			out = formats.slice();
		}
		if ( suggestion !== lastSuggestion ) {
			lastSuggestion = suggestion;
			const type = suggestion.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ];
			const author =
				suggestion.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ];
			const { start, end, role } = getSuggestionA11yDescriptor( type );
			/*
			 * Absent values are omitted rather than set to a falsy one:
			 * rich-text renders every key in this object, so an undefined
			 * entry would serialize as `role="undefined"`.
			 *
			 * Type and author are repeated onto the decoration so the
			 * per-author announcement stylesheet can select it directly. An
			 * ancestor selector would also match a decoration nested deeper
			 * inside an enclosing marker, letting that marker's author claim
			 * a run they did not suggest.
			 */
			lastDecoration = {
				type: SUGGESTION_A11Y_FORMAT_NAME,
				attributes: {
					start,
					end,
					...( role && { role } ),
					...( type !== undefined && { suggestionType: type } ),
					...( author !== undefined && { author } ),
				},
			};
		}
		out[ i ] = [
			...stack.slice( 0, markerIndex + 1 ),
			lastDecoration,
			...stack.slice( markerIndex + 1 ),
		];
	}
	return out ?? formats;
}

/**
 * Editor-only rich-text format that renders the screen-reader element inside a
 * suggestion marker. Never parsed back into values (it declares
 * `__experimentalCreatePrepareEditableTree` without a change handler, which
 * `toFormat` treats as editor-only), so neither the role nor the announcement
 * text ever reaches post content.
 */
export const suggestionA11yFormat = {
	title: __( 'Suggestion accessibility decoration' ),
	tagName: 'span',
	className: 'wp-suggestion-a11y',
	attributes: {
		role: 'role',
		start: SUGGESTION_A11Y_START_ATTRIBUTE,
		end: SUGGESTION_A11Y_END_ATTRIBUTE,
		suggestionType: SUGGESTION_TYPE_ATTRIBUTE,
		author: SUGGESTION_AUTHOR_ATTRIBUTE,
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
 * Build the CSS selector matching a suggestion's in-content marker in the
 * editor canvas. The format serializes as `<mark class="wp-suggestion">` with
 * the suggestion id in `data-suggestion-id`, so the marker element can be
 * targeted directly — no separate annotation layer needed.
 *
 * @param {number|string} id Suggestion id the marker carries.
 * @return {string} Selector for the suggestion's marker element(s).
 */
export function getSuggestionMarkerSelector( id ) {
	return getMarkerSelector( SUGGESTION_CLASS, SUGGESTION_ID_ATTRIBUTE, id );
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
