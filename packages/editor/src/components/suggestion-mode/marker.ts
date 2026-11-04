/**
 * The `metadata.suggestion` marker: the durable, in-content record of a
 * pending suggestion on a block. Structural types tag what happened to the
 * block; `after` carries proposed attribute values for any type, so an
 * attribute edit on a moved block rides along on the move's marker.
 *
 * Other authors' suggestions on the same block sit in the marker's `nested`
 * list, one entry per author, each with its own note: a removal of someone's
 * suggested block, a second attribute proposal. The block's marker is the
 * outermost suggestion; deciding it lifts the first nested entry out.
 */
import { isAttributeEqual } from './operations';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';

export const PENDING_ATTRIBUTES = 'pending-attributes';

const MARKER_TYPES = new Set( [
	PENDING_ATTRIBUTES,
	'pending-remove',
	'pending-insert',
	'pending-move',
] );

/** Metadata keys the system owns; never part of a proposal. */
const SYSTEM_METADATA_KEYS = new Set( [ 'noteId', 'suggestion' ] );

/** Attribute keys that are one-level merged rather than replaced. */
const DEEP_MERGE_KEYS = new Set( [ 'metadata' ] );

/**
 * The marker's `type` is the op type it represents; `groupId` is a shared id
 * linking the halves of a single replacement (a block-switcher transform is a
 * removal plus an insertion); `commentId` is filled in by auto-save once a
 * note comment exists for the marker; `authorId` is the ID of the user who
 * proposed the suggestion (`null` when the current user can't be resolved);
 * `crossedParents` (`pending-move` only) is true when the move changed
 * parents, which makes `fromIndex` meaningless to any consumer that only
 * sees the block's current sibling list.
 */
export interface SuggestionMarker {
	type:
		| 'pending-attributes'
		| 'pending-remove'
		| 'pending-insert'
		| 'pending-move';
	/** Proposed attribute values. JSON-safe; RichTextData stored as its string. */
	after?: Record< string, unknown >;
	commentId?: number;
	authorId?: number | null;
	groupId?: string;
	crossedParents?: boolean;
	/** Other authors' suggestions on the block; only on the outer marker. */
	nested?: SuggestionMarker[];
	[ key: string ]: any;
}

/** Marker types another author can layer on a block's suggestion. */
const NESTED_TYPES = new Set( [ PENDING_ATTRIBUTES, 'pending-remove' ] );

function isPlainObject( value: unknown ): value is Record< string, any > {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

/**
 * The block's marker, or null when it is missing, malformed, or of a type
 * this build does not know, so a hand-edited or future marker never throws
 * in render.
 *
 * @param attributes Block attributes.
 * @return The marker or null.
 */
export function readSuggestionMarker(
	attributes: Record< string, any > | null | undefined
): SuggestionMarker | null {
	const marker = attributes?.metadata?.suggestion;
	if ( ! isPlainObject( marker ) || ! MARKER_TYPES.has( marker.type ) ) {
		return null;
	}
	if ( marker.after !== undefined && ! isPlainObject( marker.after ) ) {
		return null;
	}
	return marker as SuggestionMarker;
}

/**
 * The marker's non-empty proposal, or null.
 *
 * @param marker Marker.
 * @return Proposed attributes or null.
 */
export function proposedAttributes(
	marker: SuggestionMarker | null | undefined
): Record< string, unknown > | null {
	const after = marker?.after;
	return isPlainObject( after ) && Object.keys( after ).length > 0
		? after
		: null;
}

/**
 * Markers are JSON in post content. A RichTextData (or any object that
 * stringifies to markup) is stored as its string; the rendering merge hands
 * the string back to the block, which RichText accepts.
 *
 * @param value Attribute value.
 * @return JSON-safe value.
 */
export function toJsonSafeAttributeValue( value: unknown ): unknown {
	if (
		value !== null &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		typeof ( value as any ).toString === 'function' &&
		( value as any ).toString !== Object.prototype.toString
	) {
		return String( value );
	}
	return value;
}

/**
 * Apply a proposal on top of the block's live attributes for rendering.
 * `metadata` is one-level merged so the system fields the proposal never
 * carries survive; every other key is replaced wholesale, matching
 * `setAttributes` semantics.
 *
 * @param live  Live attributes.
 * @param after Proposal; null is a no-op.
 * @return Merged attributes. Returns `live` by reference when there is
 * nothing to apply, so React's prop-identity bail-out fires.
 */
export function mergeProposedAttributes(
	live: Record< string, any >,
	after: Record< string, unknown > | null | undefined
): Record< string, any > {
	if ( ! after || Object.keys( after ).length === 0 ) {
		return live;
	}
	const merged = { ...live };
	for ( const [ key, value ] of Object.entries( after ) ) {
		if (
			DEEP_MERGE_KEYS.has( key ) &&
			isPlainObject( value ) &&
			isPlainObject( merged[ key ] )
		) {
			merged[ key ] = { ...merged[ key ], ...value };
		} else {
			merged[ key ] = value;
		}
	}
	return merged;
}

/**
 * Replace the marker on a metadata object. An `after` already on the block
 * survives a type change (an attribute edit on a block that is then moved),
 * unless the new marker carries its own, and so does the note id: the one
 * note for the block then carries the structural op and the attribute ops.
 *
 * @param currentMetadata Current block metadata.
 * @param marker          Marker to write.
 * @return New metadata with the marker applied.
 */
export function withSuggestionMarker(
	currentMetadata: Record< string, any > | null | undefined,
	marker: SuggestionMarker
): Record< string, any > {
	const existing = readSuggestionMarker( { metadata: currentMetadata } );
	const existingAfter = proposedAttributes( existing );
	let next: SuggestionMarker = marker;
	if ( existingAfter && marker.after === undefined ) {
		next = { ...next, after: existingAfter };
	}
	// Only an attribute-only note joins the structural op; a structural
	// marker being retyped keeps the replace semantics (its note describes
	// a different change).
	if (
		existing?.type === PENDING_ATTRIBUTES &&
		existing.commentId &&
		next.commentId === undefined
	) {
		next = { ...next, commentId: existing.commentId };
	}
	// Other authors' suggestions on the block are not this marker's to drop.
	if ( existing?.nested && next.nested === undefined ) {
		next = { ...next, nested: existing.nested };
	}
	return { ...( currentMetadata || {} ), suggestion: next };
}

function sanitizeProposedMetadata( value: unknown ) {
	if ( ! isPlainObject( value ) ) {
		return value;
	}
	const clean: Record< string, unknown > = {};
	for ( const [ key, entry ] of Object.entries( value ) ) {
		if ( ! SYSTEM_METADATA_KEYS.has( key ) ) {
			clean[ key ] = entry;
		}
	}
	return clean;
}

/**
 * Fold a user edit into the author's proposal on the block. Keys whose
 * proposed value equals what the author saw (the live value with every
 * other suggestion's proposal merged in) are not a suggestion and are
 * dropped; an attribute suggestion left with nothing proposed is removed.
 * On a block carrying another author's marker, the edit is the author's
 * own nested proposal, with its own note.
 *
 * @param args                Arguments.
 * @param args.metadata       The block's current metadata.
 * @param args.liveAttributes The block's live attributes (the baseline).
 * @param args.changes        The edit.
 * @param args.authorId       Author for a fresh marker.
 * @return Partial attributes for `updateBlockAttributes`.
 */
export function withProposedAttributes( {
	metadata,
	liveAttributes,
	changes,
	authorId,
}: {
	metadata: Record< string, any > | null | undefined;
	liveAttributes: Record< string, any >;
	changes: Record< string, unknown >;
	authorId: number | null;
} ): { metadata: Record< string, any > } {
	const markers = readSuggestionMarkers( { metadata } );
	const outerIsOwn =
		markers.length > 0 && isAuthorOf( markers[ 0 ], authorId );
	const ownIndex = outerIsOwn
		? 0
		: markers.findIndex(
				( entry, i ) => i > 0 && isAuthorOf( entry, authorId )
			);
	const existing = ownIndex >= 0 ? markers[ ownIndex ] : null;
	// What the author saw: the live value under everyone else's proposals.
	let seen = liveAttributes;
	for ( const [ i, entry ] of markers.entries() ) {
		if ( i !== ownIndex ) {
			seen = mergeProposedAttributes( seen, proposedAttributes( entry ) );
		}
	}
	const after: Record< string, unknown > = { ...( existing?.after ?? {} ) };
	for ( const [ key, raw ] of Object.entries( changes ) ) {
		let value = key === 'metadata' ? sanitizeProposedMetadata( raw ) : raw;
		if ( DEEP_MERGE_KEYS.has( key ) && isPlainObject( value ) ) {
			value = {
				...( isPlainObject( after[ key ] ) ? after[ key ] : {} ),
				...value,
			};
		}
		value = toJsonSafeAttributeValue( value );
		// A block with no `metadata` and one with an empty object are the
		// same block; a marker clear that lands as `metadata: {}` must not
		// read as a proposal to add nothing.
		const live =
			key === 'metadata'
				? sanitizeProposedMetadata( seen[ key ] ?? {} )
				: seen[ key ];
		if ( isAttributeEqual( live, value ) ) {
			delete after[ key ];
		} else {
			after[ key ] = value;
		}
	}
	const next = [ ...markers ];
	if ( Object.keys( after ).length > 0 ) {
		const marker: SuggestionMarker = existing
			? { ...existing, after }
			: { type: PENDING_ATTRIBUTES, authorId, after };
		if ( ownIndex >= 0 ) {
			next[ ownIndex ] = marker;
		} else {
			next.push( marker );
		}
	} else if ( existing ) {
		if ( existing.type === PENDING_ATTRIBUTES ) {
			next.splice( ownIndex, 1 );
		} else {
			const { after: _gone, ...keep } = existing;
			next[ ownIndex ] = keep as SuggestionMarker;
		}
	}
	return { metadata: withMarkerList( metadata, next ) };
}

/**
 * Metadata with the outer marker's proposal dropped: the whole marker for a
 * pending-attributes marker (the first nested suggestion takes its place),
 * only `after` on a structural one.
 *
 * @param metadata Current block metadata.
 * @return New metadata, or null when there is nothing to drop.
 */
export function withoutProposedAttributes(
	metadata: Record< string, any > | null | undefined
): Record< string, any > | null {
	const markers = readSuggestionMarkers( { metadata } );
	const marker = markers[ 0 ];
	if ( ! marker || marker.after === undefined ) {
		return null;
	}
	if ( marker.type === PENDING_ATTRIBUTES ) {
		return withMarkerList( metadata, markers.slice( 1 ) );
	}
	const { after: _gone, ...keep } = marker;
	return withMarkerList( metadata, [
		keep as SuggestionMarker,
		...markers.slice( 1 ),
	] );
}

/**
 * The nested entries of a marker that this build can read.
 *
 * @param marker Outer marker.
 * @return Valid nested entries, outermost first.
 */
function nestedOf( marker: SuggestionMarker | null ): SuggestionMarker[] {
	if ( ! marker || ! Array.isArray( marker.nested ) ) {
		return [];
	}
	return marker.nested.filter(
		( entry: unknown ): entry is SuggestionMarker =>
			isPlainObject( entry ) &&
			NESTED_TYPES.has( entry.type ) &&
			( entry.after === undefined || isPlainObject( entry.after ) )
	);
}

/**
 * Every suggestion on a block: its marker, then the nested entries.
 *
 * @param attributes Block attributes.
 * @return Markers, outermost first; empty without a marker.
 */
export function readSuggestionMarkers(
	attributes: Record< string, any > | null | undefined
): SuggestionMarker[] {
	const marker = readSuggestionMarker( attributes );
	if ( ! marker ) {
		return [];
	}
	const { nested: _nested, ...outer } = marker;
	return [ marker.nested ? outer : marker, ...nestedOf( marker ) ];
}

/**
 * Whether a marker is the author's: theirs, or one with no recorded author
 * (written before authors were recorded, or while the user was unresolved).
 *
 * @param marker   Marker.
 * @param authorId Author.
 * @return Whether the author owns it.
 */
function isAuthorOf(
	marker: SuggestionMarker,
	authorId: number | string | null | undefined
): boolean {
	return (
		marker.authorId === null ||
		marker.authorId === undefined ||
		authorId === null ||
		authorId === undefined ||
		String( marker.authorId ) === String( authorId )
	);
}

/**
 * The suggestion an author has on a block: the block's marker when it is
 * theirs, else their nested entry.
 *
 * @param attributes Block attributes.
 * @param authorId   Author.
 * @return The marker, or null.
 */
export function authorMarker(
	attributes: Record< string, any > | null | undefined,
	authorId: number | string | null | undefined
): SuggestionMarker | null {
	const marker = readSuggestionMarker( attributes );
	if ( ! marker ) {
		return null;
	}
	if ( isAuthorOf( marker, authorId ) ) {
		return marker;
	}
	return (
		nestedOf( marker ).find(
			( entry ) =>
				entry.authorId !== null &&
				entry.authorId !== undefined &&
				String( entry.authorId ) === String( authorId )
		) ?? null
	);
}

/**
 * Metadata with a marker list written back: the first entry becomes the
 * block's marker and carries the rest as `nested`.
 *
 * @param metadata Current block metadata.
 * @param markers  Markers, outermost first; nested lists on them ignored.
 * @return New metadata.
 */
function withMarkerList(
	metadata: Record< string, any > | null | undefined,
	markers: SuggestionMarker[]
): Record< string, any > {
	const { suggestion: _drop, ...rest } = metadata || {};
	if ( markers.length === 0 ) {
		return rest;
	}
	const strip = ( { nested: _nested, ...entry }: SuggestionMarker ) =>
		entry as SuggestionMarker;
	const [ outer, ...nested ] = markers.map( strip );
	return {
		...rest,
		suggestion: nested.length ? { ...outer, nested } : outer,
	};
}

/**
 * Write an author's marker on a block. A block with no marker, or with
 * their own, takes it as its marker (`withSuggestionMarker`). On another
 * author's marker it nests, merged with the author's nested entry if they
 * have one, so their note and proposal stay with it. A move takes the
 * outer place, since the block's position is the move's; what was there
 * nests under it.
 *
 * @param metadata Current block metadata.
 * @param authorId Author.
 * @param marker   Marker to write.
 * @return New metadata.
 */
export function withAuthorMarker(
	metadata: Record< string, any > | null | undefined,
	authorId: number | string | null | undefined,
	marker: SuggestionMarker
): Record< string, any > {
	const markers = readSuggestionMarkers( { metadata } );
	if ( markers.length === 0 || isAuthorOf( markers[ 0 ], authorId ) ) {
		return withSuggestionMarker( metadata, marker );
	}
	const index = markers.findIndex(
		( entry, i ) => i > 0 && isAuthorOf( entry, authorId )
	);
	const own = index > 0 ? markers[ index ] : null;
	const merged: SuggestionMarker = {
		...marker,
		...( own?.commentId && marker.commentId === undefined
			? { commentId: own.commentId }
			: {} ),
		...( own?.after && marker.after === undefined
			? { after: own.after }
			: {} ),
	};
	const others = markers.filter( ( _entry, i ) => i !== index );
	if ( marker.type === 'pending-move' ) {
		return withMarkerList( metadata, [ merged, ...others ] );
	}
	return withMarkerList( metadata, [ ...others, merged ] );
}

/**
 * Metadata without the suggestion a note holds. Taking out the block's
 * marker lifts the first nested entry into its place.
 *
 * @param metadata  Current block metadata.
 * @param commentId Note id.
 * @return New metadata, or null when no marker on the block has that note.
 */
export function withoutMarkerEntry(
	metadata: Record< string, any > | null | undefined,
	commentId: number | string
): Record< string, any > | null {
	const markers = readSuggestionMarkers( { metadata } );
	const index = markers.findIndex(
		( entry ) =>
			entry.commentId !== undefined &&
			String( entry.commentId ) === String( commentId )
	);
	if ( index < 0 ) {
		return null;
	}
	return withMarkerList(
		metadata,
		markers.filter( ( _entry, i ) => i !== index )
	);
}

/**
 * Whether a note is one of the block's nested suggestions (not its marker).
 *
 * @param attributes Block attributes.
 * @param commentId  Note id.
 * @return The nested entry, or null.
 */
export function nestedMarkerFor(
	attributes: Record< string, any > | null | undefined,
	commentId: number | string
): SuggestionMarker | null {
	return (
		nestedOf( readSuggestionMarker( attributes ) ).find(
			( entry ) =>
				entry.commentId !== undefined &&
				String( entry.commentId ) === String( commentId )
		) ?? null
	);
}

/**
 * Sort key for display order: saved suggestions by note id, unsaved ones
 * (no note yet, so the newest) after them in list order.
 *
 * @param marker Marker.
 * @return Sort key.
 */
function noteOrder( marker: SuggestionMarker ): number {
	const id = Number( marker.commentId );
	return Number.isFinite( id ) && id > 0 ? id : Number.MAX_SAFE_INTEGER;
}

/**
 * What a block shows as proposed: every suggestion's `after` merged in note
 * id order, so where two proposals set one attribute the later one wins.
 *
 * @param marker The block's marker.
 * @return The merged proposal, or null when nothing is proposed.
 */
export function displayedProposal(
	marker: SuggestionMarker | null | undefined
): Record< string, unknown > | null {
	if ( ! marker ) {
		return null;
	}
	const nested = nestedOf( marker );
	if ( nested.length === 0 ) {
		return proposedAttributes( marker );
	}
	const ordered = [ marker, ...nested ]
		.map( ( entry, position ) => ( { entry, position } ) )
		.sort(
			( a, b ) =>
				noteOrder( a.entry ) - noteOrder( b.entry ) ||
				a.position - b.position
		);
	let merged: Record< string, any > = {};
	for ( const { entry } of ordered ) {
		merged = mergeProposedAttributes( merged, proposedAttributes( entry ) );
	}
	return Object.keys( merged ).length > 0 ? merged : null;
}

/**
 * Metadata without the attribute proposals a decision left with nothing to
 * change: keys now equal to the live value are dropped, and an attribute
 * suggestion left with none goes. Its note becomes outdated on save (another
 * author's) or is collected (the current user's).
 *
 * @param metadata       Current block metadata.
 * @param liveAttributes The block's attributes after the decision.
 * @return New metadata, or `metadata` itself when nothing changed.
 */
export function withoutOutdatedProposals(
	metadata: Record< string, any > | null | undefined,
	liveAttributes: Record< string, any >
): Record< string, any > | null | undefined {
	const markers = readSuggestionMarkers( { metadata } );
	let changed = false;
	const kept: SuggestionMarker[] = [];
	for ( const entry of markers ) {
		const after = proposedAttributes( entry );
		if ( ! after ) {
			kept.push( entry );
			continue;
		}
		const remaining: Record< string, unknown > = {};
		for ( const [ key, value ] of Object.entries( after ) ) {
			if ( ! isAttributeEqual( liveAttributes[ key ], value ) ) {
				remaining[ key ] = value;
			}
		}
		if ( Object.keys( remaining ).length === Object.keys( after ).length ) {
			kept.push( entry );
			continue;
		}
		changed = true;
		if ( Object.keys( remaining ).length > 0 ) {
			kept.push( { ...entry, after: remaining } );
		} else if ( entry.type !== PENDING_ATTRIBUTES ) {
			const { after: _gone, ...structural } = entry;
			kept.push( structural as SuggestionMarker );
		}
	}
	return changed ? withMarkerList( metadata, kept ) : metadata;
}

/**
 * The anchors a block's markers give their notes, as `[ noteId, kind ]`
 * pairs: each marker's own `commentId` with its type (and
 * `pending-attributes` when it proposes attributes). A marker with no
 * `commentId` yet falls back to the block's `metadata.noteId` links not
 * claimed by another marker, as before markers were nested.
 *
 * @param metadata Block metadata.
 * @return Anchors.
 */
export function markerAnchorKeys(
	metadata: Record< string, any > | null | undefined
): Array< [ number, string ] > {
	const markers = readSuggestionMarkers( { metadata } );
	const claimed = new Set(
		markers
			.map( ( entry ) => Number( entry.commentId ) )
			.filter( ( id ) => id > 0 )
	);
	const anchors: Array< [ number, string ] > = [];
	for ( const entry of markers ) {
		const own = Number( entry.commentId );
		const ids =
			own > 0
				? [ own ]
				: getNoteIdsFromMetadata( metadata ?? undefined )
						.map( Number )
						.filter(
							( id: number ) => id > 0 && ! claimed.has( id )
						);
		for ( const id of ids ) {
			anchors.push( [ id, entry.type ] );
			if (
				entry.type !== PENDING_ATTRIBUTES &&
				proposedAttributes( entry )
			) {
				anchors.push( [ id, PENDING_ATTRIBUTES ] );
			}
		}
	}
	return anchors;
}

/**
 * Metadata with one of the block's markers replaced, wherever it sits.
 *
 * @param metadata Current block metadata.
 * @param entry    The marker to replace, as read from the block.
 * @param next     Its replacement.
 * @return New metadata, or null when the marker is no longer on the block.
 */
export function withMarkerEntryReplaced(
	metadata: Record< string, any > | null | undefined,
	entry: SuggestionMarker,
	next: SuggestionMarker
): Record< string, any > | null {
	const outer = readSuggestionMarker( { metadata } );
	if ( ! outer ) {
		return null;
	}
	if ( entry === outer ) {
		return { ...metadata, suggestion: next };
	}
	const index = ( outer.nested ?? [] ).indexOf( entry );
	if ( index < 0 ) {
		return null;
	}
	const nested = [ ...( outer.nested ?? [] ) ];
	nested[ index ] = next;
	return { ...metadata, suggestion: { ...outer, nested } };
}
