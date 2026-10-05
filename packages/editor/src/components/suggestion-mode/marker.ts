/**
 * The `metadata.suggestion` marker: the durable, in-content record of a
 * pending suggestion on a block. Structural types tag what happened to the
 * block; `after` carries proposed attribute values for any type, so an
 * attribute edit on a moved block rides along on the move's marker.
 */
import { isAttributeEqual } from './operations';

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
	[ key: string ]: any;
}

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
 * unless the new marker carries its own.
 *
 * @param currentMetadata Current block metadata.
 * @param marker          Marker to write.
 * @return New metadata with the marker applied.
 */
export function withSuggestionMarker(
	currentMetadata: Record< string, any > | null | undefined,
	marker: SuggestionMarker
): Record< string, any > {
	const existingAfter = proposedAttributes(
		readSuggestionMarker( { metadata: currentMetadata } )
	);
	const next: SuggestionMarker =
		existingAfter && marker.after === undefined
			? { ...marker, after: existingAfter }
			: marker;
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
 * Fold a user edit into the block's proposal. Keys whose proposed value
 * equals the live value are not a suggestion and are dropped; a
 * pending-attributes marker left with nothing proposed is removed.
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
	const existing = readSuggestionMarker( { metadata } );
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
		const live =
			key === 'metadata'
				? sanitizeProposedMetadata( liveAttributes[ key ] )
				: liveAttributes[ key ];
		if ( isAttributeEqual( live, value ) ) {
			delete after[ key ];
		} else {
			after[ key ] = value;
		}
	}
	const { suggestion: _drop, ...rest } = metadata || {};
	if ( Object.keys( after ).length === 0 ) {
		if ( ! existing || existing.type === PENDING_ATTRIBUTES ) {
			return { metadata: rest };
		}
		const { after: _gone, ...keep } = existing;
		return { metadata: { ...rest, suggestion: keep } };
	}
	const marker: SuggestionMarker = existing
		? { ...existing, after }
		: { type: PENDING_ATTRIBUTES, authorId, after };
	return { metadata: { ...rest, suggestion: marker } };
}

/**
 * Metadata with the proposal dropped: the whole marker for a
 * pending-attributes marker, only `after` on a structural one.
 *
 * @param metadata Current block metadata.
 * @return New metadata, or null when there is nothing to drop.
 */
export function withoutProposedAttributes(
	metadata: Record< string, any > | null | undefined
): Record< string, any > | null {
	const marker = readSuggestionMarker( { metadata } );
	if ( ! marker || marker.after === undefined ) {
		return null;
	}
	const { suggestion: _drop, ...rest } = metadata || {};
	if ( marker.type === PENDING_ATTRIBUTES ) {
		return rest;
	}
	const { after: _gone, ...keep } = marker;
	return { ...rest, suggestion: keep };
}
