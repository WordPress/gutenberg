import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import {
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import {
	findMarkerRange,
	findMarkerText,
	getMarkerSelector,
} from '../inline-markers';

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

/** A kind of inline suggestion marker. */
export type SuggestionMarkerKind = 'add' | 'del' | 'format';

/**
 * One rich-text format per marker kind. Rich text keeps one format of a type
 * per character, so a single shared format would let a second author's marker
 * over the same text replace the first and take its attribution. With one
 * format per kind, a deletion or a formatting change can sit inside someone
 * else's addition. Same-kind overlap is still refused by the editing paths.
 *
 * Each kind serializes as `<mark class="wp-suggestion-<kind>">` plus the
 * `data-suggestion-id`, `data-suggestion-type` and `data-author` attributes.
 * The class is authoritative: `data-suggestion-type` is written alongside it
 * for styling and the a11y decoration. `gutenberg_get_suggestion_marker_kind()`
 * is the PHP mirror of this contract, and `SUGGESTION_MARKER_CLASSES` in
 * `store/constants.ts` the store's copy of the class tokens.
 */
export const SUGGESTION_MARKER_KINDS: Record<
	SuggestionMarkerKind,
	{ formatName: string; className: string }
> = {
	add: {
		formatName: 'core/suggestion-add',
		className: 'wp-suggestion-add',
	},
	del: {
		formatName: 'core/suggestion-del',
		className: 'wp-suggestion-del',
	},
	format: {
		formatName: 'core/suggestion-format',
		className: 'wp-suggestion-format',
	},
};

/**
 * Canonical nesting of markers on a character, outermost first: an addition
 * goes away as a unit, so whatever is nested in it sits inside it; a format
 * marker sits outside a deletion so a straddling deletion fragments (harmless,
 * it only unwraps) rather than the format marker, whose original run the
 * server restores in one piece.
 */
export const SUGGESTION_KIND_ORDER: readonly SuggestionMarkerKind[] = [
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_FORMAT,
	SUGGESTION_TYPE_DELETION,
] as SuggestionMarkerKind[];

/** Every marker format name, in `SUGGESTION_MARKER_KINDS` order. */
export const SUGGESTION_FORMAT_NAMES: readonly string[] = Object.values(
	SUGGESTION_MARKER_KINDS
).map( ( { formatName } ) => formatName );

/** Every marker class token, in `SUGGESTION_MARKER_KINDS` order. */
export const SUGGESTION_CLASSES: readonly string[] = Object.values(
	SUGGESTION_MARKER_KINDS
).map( ( { className } ) => className );

/**
 * Substring every marker's serialized class carries. Only a cheap pre-filter
 * before a parse: `wp-suggestion-a11y` and prose about the feature match too.
 */
export const SUGGESTION_CLASS_PROBE = 'wp-suggestion-';

const KIND_BY_FORMAT_NAME = new Map< string, SuggestionMarkerKind >(
	(
		Object.entries( SUGGESTION_MARKER_KINDS ) as Array<
			[ SuggestionMarkerKind, { formatName: string } ]
		>
	 ).map( ( [ kind, { formatName } ] ) => [ formatName, kind ] )
);

/**
 * The marker kind of a rich-text format, or null for any other format.
 *
 * @param format Rich-text format.
 * @return Marker kind.
 */
export function suggestionKindOf( format: any ): SuggestionMarkerKind | null {
	return ( format && KIND_BY_FORMAT_NAME.get( format.type ) ) ?? null;
}

/**
 * Whether a rich-text format is an inline suggestion marker of any kind.
 *
 * @param format Rich-text format.
 * @return True for a marker.
 */
export function isSuggestionFormat( format: any ): boolean {
	return suggestionKindOf( format ) !== null;
}

/**
 * The rich-text format name of a marker kind.
 *
 * @param kind Marker kind.
 * @return Format name.
 */
export function suggestionFormatNameFor( kind: SuggestionMarkerKind ): string {
	return SUGGESTION_MARKER_KINDS[ kind ].formatName;
}

/**
 * The markers in one character's format stack, by kind. A stack holds at most
 * one marker of each kind.
 *
 * @param stack Per-character format stack.
 * @return Markers present, keyed by kind.
 */
export function suggestionMarkersAt(
	stack: any[] | undefined | null
): Partial< Record< SuggestionMarkerKind, any > > {
	const markers: Partial< Record< SuggestionMarkerKind, any > > = {};
	for ( const format of stack ?? [] ) {
		const kind = suggestionKindOf( format );
		if ( kind && ! markers[ kind ] ) {
			markers[ kind ] = format;
		}
	}
	return markers;
}

/**
 * Every marker in one character's format stack, outermost first.
 *
 * @param stack Per-character format stack.
 * @return Marker formats.
 */
export function suggestionMarkersIn( stack: any[] | undefined | null ): any[] {
	return ( stack ?? [] ).filter( isSuggestionFormat );
}

/**
 * Whether two marker formats are the same marker: same kind, same attributes.
 *
 * @param a Marker format.
 * @param b Marker format.
 * @return True when equal.
 */
function isSameMarker( a: any, b: any ): boolean {
	if ( a === b ) {
		return true;
	}
	if ( ! a || ! b || a.type !== b.type ) {
		return false;
	}
	const keysA = Object.keys( a.attributes ?? {} );
	const keysB = Object.keys( b.attributes ?? {} );
	return (
		keysA.length === keysB.length &&
		keysA.every( ( key ) => a.attributes[ key ] === b.attributes?.[ key ] )
	);
}

/**
 * Reorder every character's format stack so markers come first, in
 * `SUGGESTION_KIND_ORDER`, followed by the other formats in their existing
 * order, and let adjacent characters share one object for the same marker.
 *
 * `applyFormat` slots a new format in at the shallowest depth its whole range
 * shares, so the nesting of two markers - and with it the serialized bytes -
 * would depend on the order they were written in. One fixed order keeps the
 * HTML identical for the same state (stable round trips and RTC merges) and
 * never splits a format marker around a nested deletion.
 *
 * `toTree` reuses an element while the formats at each depth stay the same
 * objects, so a marker parsed from two adjacent elements (or written in two
 * steps) is unified onto one object here; otherwise one run would serialize
 * as two `<mark>`s depending on how it was produced.
 *
 * @param record Rich-text record.
 * @return The record, reordered; the same record when already canonical.
 */
export function canonicalizeSuggestionStack< T extends { formats: any[] } >(
	record: T
): T {
	let formats: any[] | null = null;
	let previous: any[] = [];
	for ( let index = 0; index < record.formats.length; index++ ) {
		const stack = record.formats[ index ];
		const markers = Array.isArray( stack )
			? suggestionMarkersIn( stack )
			: [];
		if ( ! markers.length ) {
			previous = [];
			continue;
		}
		markers.sort(
			( a, b ) =>
				SUGGESTION_KIND_ORDER.indexOf( suggestionKindOf( a )! ) -
				SUGGESTION_KIND_ORDER.indexOf( suggestionKindOf( b )! )
		);
		const unified = markers.map(
			( marker ) =>
				previous.find( ( candidate ) =>
					isSameMarker( candidate, marker )
				) ?? marker
		);
		previous = unified;
		const ordered = [
			...unified,
			...stack.filter(
				( format: any ) => ! isSuggestionFormat( format )
			),
		];
		if ( ordered.every( ( format, i ) => format === stack[ i ] ) ) {
			continue;
		}
		formats ??= record.formats.slice();
		formats[ index ] = ordered;
	}
	return formats ? { ...record, formats } : record;
}

/**
 * Rich-text format settings for one marker kind.
 *
 * The `edit` component is inert here: markers are written by the Suggestion
 * mode keyboards and the content reconciler, not from a toolbar entry.
 * Registering the format is what lets rich text round-trip the marker and the
 * annotations API decorate it.
 *
 * @param kind Marker kind.
 * @return Format settings.
 */
function markerFormatSettings( kind: SuggestionMarkerKind ) {
	return {
		title: __( 'Suggestion' ),
		tagName: 'mark',
		className: SUGGESTION_MARKER_KINDS[ kind ].className,
		attributes: {
			[ SUGGESTION_ID_ATTRIBUTE ]: SUGGESTION_ID_ATTRIBUTE,
			[ SUGGESTION_TYPE_ATTRIBUTE ]: SUGGESTION_TYPE_ATTRIBUTE,
			[ SUGGESTION_AUTHOR_ATTRIBUTE ]: SUGGESTION_AUTHOR_ATTRIBUTE,
		},
		edit: () => null,
	};
}

/** Format settings for each marker kind, keyed by kind. */
export const suggestionMarkerFormats: Record<
	SuggestionMarkerKind,
	ReturnType< typeof markerFormatSettings >
> = {
	add: markerFormatSettings( SUGGESTION_TYPE_ADDITION as 'add' ),
	del: markerFormatSettings( SUGGESTION_TYPE_DELETION as 'del' ),
	format: markerFormatSettings( SUGGESTION_TYPE_FORMAT as 'format' ),
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
 * @param type Marker `data-suggestion-type` value.
 * @return Announcement pair and role.
 */
export function getSuggestionA11yDescriptor( type?: string | null ): {
	start: string;
	end: string;
	role: string | null;
} {
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
 * semantics. A bare `<mark class="wp-suggestion-del">` is invisible to
 * assistive technology - a suggested deletion reads as normal text. For each
 * rich-text run covered by a marker, nest a `core/suggestion-a11y` format
 * carrying the bracketing announcements for its kind and, where one applies,
 * `role="insertion"` (add markers) or `role="deletion"` (del markers), which
 * ARIA maps to `<ins>`/`<del>` semantics.
 *
 * The role must never serialize into post content, so it cannot live on the
 * marker format itself (reading the editable DOM back would absorb it). It is
 * applied here, at editable-tree preparation time only: formats added by a
 * `__experimentalCreatePrepareEditableTree` handler render into the editable
 * DOM but are ignored when the DOM is parsed back into a value (see
 * `toFormat` in `@wordpress/rich-text`), exactly like `core/annotation`.
 *
 * Every marker in a stack gets its own decoration, so nested suggestions read
 * as outer start, inner start, text, inner end, outer end. One decoration
 * object is reused across each marker's run (rich text merges adjacent
 * identical format references into a single element), so a marker gains
 * exactly one nested role element.
 *
 * Each decoration is spliced in directly after its marker rather than pushed
 * onto the end of the stack. `toTree` decides whether to reuse an element by
 * comparing format stacks *by index*, so a bold run or link covering only part
 * of a marker would shift a trailing decoration's index and split it into two
 * elements - and two elements means the closing announcement is read out
 * mid-suggestion and the opening one repeated. Sitting immediately inside the
 * marker keeps its index fixed for the marker's whole run.
 *
 * @param formats Per-character format stacks.
 * @return Format stacks with role decorations added.
 */
export function addSuggestionRoleFormats( formats: any[] | undefined ): any {
	if ( ! formats || formats.length === 0 ) {
		return formats;
	}
	let out: any[] | null = null;
	const decorations = new Map< any, any >();
	const decorationFor = ( marker: any ) => {
		let decoration = decorations.get( marker );
		if ( decoration ) {
			return decoration;
		}
		const type = suggestionKindOf( marker )!;
		const author = marker.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ];
		const { start, end, role } = getSuggestionA11yDescriptor( type );
		/*
		 * Absent values are omitted rather than set to a falsy one: rich
		 * text renders every key in this object, so an undefined entry would
		 * serialize as `role="undefined"`.
		 *
		 * Type and author are repeated onto the decoration so the per-author
		 * announcement stylesheet can select it directly. An ancestor
		 * selector would also match a decoration nested deeper inside an
		 * enclosing marker, letting that marker's author claim a run they did
		 * not suggest.
		 */
		decoration = {
			type: SUGGESTION_A11Y_FORMAT_NAME,
			attributes: {
				start,
				end,
				...( role && { role } ),
				suggestionType: type,
				...( author !== undefined && { author } ),
			},
		};
		decorations.set( marker, decoration );
		return decoration;
	};
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		if ( ! Array.isArray( stack ) || ! stack.some( isSuggestionFormat ) ) {
			continue;
		}
		out ??= formats.slice();
		const decorated: any[] = [];
		for ( const format of stack ) {
			decorated.push( format );
			if ( isSuggestionFormat( format ) ) {
				decorated.push( decorationFor( format ) );
			}
		}
		out[ i ] = decorated;
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
 * Idempotently register the marker formats, one per kind, so rich text can
 * round-trip a suggestion `<mark>` in block content and the annotations API can
 * decorate it. Guarded against duplicate registration (HMR, repeated editor
 * bootstrap, tests) the same way `core/note` is registered. Also registers the
 * editor-only `core/suggestion-a11y` decoration format that gives markers
 * screen-reader `role="insertion"`/`role="deletion"` semantics at render time.
 *
 * The formats themselves are generic (inert `edit`); a consumer that owns the
 * suggesting UI - Suggestion mode - passes its own `edit`, registered on every
 * kind, so the marker-aware caret UI lives with the feature, not the
 * primitive.
 *
 * @param [edit] Optional rich-text format `edit` component.
 */
export function registerSuggestionFormat( edit?: any ) {
	const getFormatType = ( name: string ) =>
		( select( richTextStore as any ) as any ).getFormatType( name );
	if ( ! getFormatType( SUGGESTION_A11Y_FORMAT_NAME ) ) {
		registerFormatType(
			SUGGESTION_A11Y_FORMAT_NAME,
			suggestionA11yFormat as any
		);
	}
	for ( const kind of SUGGESTION_KIND_ORDER ) {
		const name = suggestionFormatNameFor( kind );
		if ( getFormatType( name ) ) {
			continue;
		}
		const settings = suggestionMarkerFormats[ kind ];
		registerFormatType(
			name,
			( edit ? { ...settings, edit } : settings ) as any
		);
	}
}

/**
 * Unregister every format `registerSuggestionFormat` registered. For tests and
 * teardown; a no-op for formats that are not registered.
 */
export function unregisterSuggestionFormats() {
	for ( const name of [
		...SUGGESTION_FORMAT_NAMES,
		SUGGESTION_A11Y_FORMAT_NAME,
	] ) {
		if ( ( select( richTextStore as any ) as any ).getFormatType( name ) ) {
			unregisterFormatType( name );
		}
	}
}

/**
 * Build the CSS selector matching a suggestion's in-content markers in the
 * editor canvas, whatever their kind: a replacement's id is carried by an add
 * marker and a del marker.
 *
 * @param id Suggestion id the marker carries.
 * @return Selector for the suggestion's marker element(s).
 */
export function getSuggestionMarkerSelector( id: number | string ): string {
	return getMarkerSelector( SUGGESTION_CLASSES, SUGGESTION_ID_ATTRIBUTE, id );
}

/**
 * Resolve a suggestion marker's live character range in a rich-text value by
 * id, deriving the position from the in-content markers on every read. The
 * range spans every marker carrying the id; pass `kind` to look at one kind
 * only (a replacement's add half, say).
 *
 * @param value  Block attribute value (RichTextData, string, or other).
 * @param id     Suggestion id to search for.
 * @param [kind] Only markers of this kind.
 * @return Range or null when no marker is found.
 */
export function findSuggestionRange(
	value: any,
	id: number | string,
	kind?: SuggestionMarkerKind
): { start: number; end: number } | null {
	return findMarkerRange( value, {
		formatType: kind
			? suggestionFormatNameFor( kind )
			: SUGGESTION_FORMAT_NAMES,
		idAttribute: SUGGESTION_ID_ATTRIBUTE,
		id,
		quickReject: SUGGESTION_CLASS_PROBE,
	} );
}

/**
 * Resolve the visible text wrapped by a suggestion marker, by id, deriving it
 * from the in-content marker on every read. Used to summarize what an inline
 * suggestion proposes to add or remove (e.g. `Add: "new text"` in the sidebar)
 * without storing the text in the suggestion payload.
 *
 * @param value  Block attribute value (RichTextData, string, or other).
 * @param id     Suggestion id to search for.
 * @param [kind] Only quote runs of this marker kind.
 * @return The marked text, or '' when no marker is found.
 */
export function findSuggestionText(
	value: any,
	id: number | string,
	kind?: string
): string {
	return findMarkerText( value, {
		formatType:
			kind && Object.hasOwn( SUGGESTION_MARKER_KINDS, kind )
				? suggestionFormatNameFor( kind as SuggestionMarkerKind )
				: SUGGESTION_FORMAT_NAMES,
		idAttribute: SUGGESTION_ID_ATTRIBUTE,
		id,
		quickReject: SUGGESTION_CLASS_PROBE,
	} );
}
