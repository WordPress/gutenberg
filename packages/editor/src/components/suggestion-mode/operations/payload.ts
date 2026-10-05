/**
 * Suggestion payload: the JSON stored in a note's `_wp_suggestion` meta.
 * Pure helpers to build, measure, parse and migrate it.
 */
import type { SuggestionOperation } from '../suggestion-session';

/**
 * A single suggestion operation.
 *
 * `type` is one of `attribute-set` / `inline-suggestion` (Phase 2) or the
 * structural variants `block-insert-after` / `block-remove` / `block-move`
 * (Phase 6, issue #77434). Other fields vary by type:
 *   - `attribute`      The attribute being changed (`attribute-set`) or
 *                      carrying the marker (`inline-suggestion`).
 *   - `suggestionType` Inline marker kind (`inline-suggestion` only): `del`
 *                      wraps existing text proposed for removal, `add` wraps
 *                      proposed new text, `format` wraps a run whose
 *                      formatting changed (text unchanged), `replace` owns
 *                      an `add` run and the `del` run after it.
 *   - `beforeHTML`     Original run HTML captured for a `format` suggestion,
 *                      so a reject can restore the pre-suggestion formatting.
 *   - `afterHTML`      Proposed run HTML for a `format` suggestion, used to
 *                      summarize which formats changed.
 *   - `before`/`after` The baseline and proposed values (`attribute-set`).
 */
export type { SuggestionOperation };

export interface SuggestionPayload {
	/** Payload schema version. */
	schemaVersion: number;
	/** Block name at capture time. */
	blockName: string;
	/**
	 * Post `modified_gmt` at capture, used by Phase 3 to detect stale
	 * suggestions.
	 */
	baseRevision: string | null;
	/** Ordered operations. */
	operations: SuggestionOperation[];
}

/**
 * Suggestion payload schema version. v1 emitted only `attribute-set`
 * operations; v2 reserves the structural op types (`block-insert-after`,
 * `block-remove`, `block-move`) tracked in issue #77434.
 *
 * Reader rule:
 *   parsed < SCHEMA_VERSION → migrate forward, then apply.
 *   parsed === SCHEMA_VERSION → apply as-is.
 *   parsed > SCHEMA_VERSION → refuse (newer-editor notice; offer Reject only).
 *
 * Bumping this constant requires a corresponding migration step in
 * `parseSuggestionPayload`.
 */
export const SCHEMA_VERSION = 2;

/**
 * Maximum byte length of a serialized suggestion payload. Mirrors
 * `GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES` in
 * `lib/compat/wordpress-7.1/block-suggestions.php`. The client checks before
 * submitting so a doomed request never leaves the browser; the REST
 * controller is the authoritative gate.
 */
export const PAYLOAD_MAX_BYTES = 65536;

/**
 * Byte length of a serialized payload, measured the way PHP `strlen()`
 * counts (UTF-8 bytes, not chars).
 *
 * @param payload Payload to measure.
 * @return UTF-8 byte length of the serialized JSON.
 */
export function payloadByteLength( payload: SuggestionPayload ): number {
	const serialized = JSON.stringify( payload );
	if ( typeof TextEncoder !== 'undefined' ) {
		return new TextEncoder().encode( serialized ).length;
	}
	// Conservative upper bound: 4 bytes per UTF-16 code unit covers all
	// possible UTF-8 expansions. Used only in test/JSDOM environments
	// without TextEncoder.
	return serialized.length * 4;
}

/**
 * Assemble a current-version payload.
 *
 * @param args              Payload fields.
 * @param args.blockName    Block name at capture time.
 * @param args.baseRevision Post `modified_gmt` at capture.
 * @param args.operations   Ordered operations.
 * @return The payload.
 */
export function buildSuggestionPayload( {
	blockName,
	baseRevision,
	operations,
}: {
	blockName: string;
	baseRevision: string | null;
	operations: SuggestionOperation[];
} ): SuggestionPayload {
	return {
		schemaVersion: SCHEMA_VERSION,
		blockName,
		baseRevision,
		operations,
	};
}

/**
 * Migrate a payload emitted by an older `SCHEMA_VERSION` up to the current
 * shape. v1 → v2 is a pure additive change (structural op types reserved but
 * v1 payloads never used them), so the migration just stamps the version
 * field forward — no shape rewriting is needed.
 *
 * Add a new `case` per future bump; never remove old cases, since the
 * comment-meta store may contain payloads written by every prior version.
 *
 * @param parsed Parsed JSON payload of a known older version.
 * @return Payload upgraded to the current schema.
 */
export function migrateSuggestionPayload(
	parsed: SuggestionPayload
): SuggestionPayload {
	let next = parsed;
	if ( next.schemaVersion === 1 ) {
		next = { ...next, schemaVersion: 2 };
	}
	return next;
}

/**
 * Parse a `_wp_suggestion` meta value into a typed payload. Refuses payloads
 * written by a newer editor (`schemaVersion > SCHEMA_VERSION`) so a partial
 * apply can't drop op types this consumer doesn't understand. Migrates
 * older payloads forward to the current shape.
 *
 * @param raw The raw JSON string from comment meta.
 * @return Parsed payload, or null when the input is
 * malformed or the payload was written by a newer editor.
 */
export function parseSuggestionPayload(
	raw: string | null | undefined
): SuggestionPayload | null {
	if ( ! raw ) {
		return null;
	}
	let parsed: any;
	try {
		parsed = JSON.parse( raw );
	} catch {
		return null;
	}
	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		! Array.isArray( parsed.operations )
	) {
		return null;
	}
	// Pre-versioned payloads (schemaVersion missing) are treated as v1 — the
	// only writer that emitted them was the v1 implementation.
	const version =
		typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1;
	if ( version > SCHEMA_VERSION ) {
		return null;
	}
	if ( version < SCHEMA_VERSION ) {
		return migrateSuggestionPayload( {
			...parsed,
			schemaVersion: version,
		} );
	}
	return parsed;
}
