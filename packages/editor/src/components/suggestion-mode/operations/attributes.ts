/**
 * Pure functions over block attributes: diffing a proposal into operations,
 * applying operations, detecting conflicts and clearing the pending marker.
 */
import type { SuggestionOperation } from './payload';
import {
	findPostAttributeOps,
	findStructuralOp,
	POST_ATTRIBUTE_OP_TYPE,
} from './locate';

/**
 * Structural equality for attribute values. Handles primitives, arrays, and
 * plain objects with arbitrary key order.
 *
 * `JSON.stringify` is order-sensitive ({a:1,b:2} ≠ {b:2,a:1}), so a stringify-
 * based compare produces spurious "changed" detections when block code re-
 * emits a `style` object with reordered keys. The recursive walk avoids that.
 *
 * @param a First value.
 * @param b Second value.
 * @return True when the values are structurally equal.
 */
export function isAttributeEqual( a: any, b: any ): boolean {
	if ( a === b ) {
		return true;
	}
	if ( a === null || a === undefined || b === null || b === undefined ) {
		return false;
	}
	// One side is a primitive (typically a string from a JSON-deserialized
	// suggestion payload) and the other is a wrapper object (typically a
	// `RichTextData` instance from the live block-editor store). Compare
	// their string representations so the same logical content reads as
	// equal across the serialization boundary — otherwise `hasAttributeConflict`
	// flags every content suggestion as stale and the apply flow short-
	// circuits to a never-visible "stale" dialog.
	const aIsObject = typeof a === 'object';
	const bIsObject = typeof b === 'object';
	if ( aIsObject !== bIsObject ) {
		return String( a ) === String( b );
	}
	if ( ! aIsObject ) {
		return false;
	}
	const aIsArray = Array.isArray( a );
	const bIsArray = Array.isArray( b );
	if ( aIsArray !== bIsArray ) {
		return false;
	}
	if ( aIsArray ) {
		if ( a.length !== b.length ) {
			return false;
		}
		for ( let i = 0; i < a.length; i++ ) {
			if ( ! isAttributeEqual( a[ i ], b[ i ] ) ) {
				return false;
			}
		}
		return true;
	}
	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );
	if ( aKeys.length !== bKeys.length ) {
		return false;
	}
	// Wrapper objects like `RichTextData` hold their content in private
	// class fields, so `Object.keys()` returns an empty array for any two
	// instances regardless of the text they wrap. Fall back to a string
	// compare so two wrappers with different content don't look equal.
	if ( aKeys.length === 0 ) {
		return String( a ) === String( b );
	}
	for ( const key of aKeys ) {
		if ( ! Object.prototype.hasOwnProperty.call( b, key ) ) {
			return false;
		}
		if ( ! isAttributeEqual( a[ key ], b[ key ] ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Build attribute-set operations from a block's proposal: one op per
 * proposed attribute whose value differs from the live (baseline) value.
 * Unchanged or absent keys are skipped.
 *
 * @param liveAttributes The block's live attributes (the baseline).
 * @param after          The marker's proposed attributes.
 * @return Operations describing the suggestion.
 */
export function operationsFromMarker(
	liveAttributes: Record< string, any > | null | undefined,
	after: Record< string, any > | null | undefined
): SuggestionOperation[] {
	const operations: SuggestionOperation[] = [];
	for ( const [ attribute, proposed ] of Object.entries( after || {} ) ) {
		const before = liveAttributes?.[ attribute ];
		if ( ! isAttributeEqual( before, proposed ) ) {
			operations.push( {
				type: 'attribute-set',
				attribute,
				before: before ?? null,
				after: proposed,
			} );
		}
	}
	return operations;
}

/** A post field proposal, as the editor store holds it. */
export interface PostFieldProposal {
	/** The post field, e.g. `excerpt` or `meta`. */
	attribute: string;
	/** The meta key, for a `meta` proposal. */
	key?: string;
	baseline: any;
	proposed: any;
	/**
	 * The pending note the proposal was restored from after a reload, which
	 * later edits update rather than opening another.
	 */
	commentId?: number;
	/**
	 * The value that note holds as restored. Undo goes back to it rather
	 * than withdrawing the note, since it was proposed in an earlier
	 * session.
	 */
	noteValue?: any;
}

/**
 * Build the `post-attribute-set` operation for a post field proposal. A
 * meta proposal carries its key: one note per meta key.
 *
 * @param proposal The proposal.
 * @return Operations describing the suggestion (empty when nothing changed).
 */
export function postOperationsFromProposal(
	proposal: PostFieldProposal | null | undefined
): SuggestionOperation[] {
	if (
		! proposal ||
		isAttributeEqual( proposal.baseline ?? null, proposal.proposed ?? null )
	) {
		return [];
	}
	return [
		{
			type: POST_ATTRIBUTE_OP_TYPE,
			attribute: proposal.attribute,
			...( proposal.key ? { key: proposal.key } : {} ),
			before: proposal.baseline ?? null,
			after: proposal.proposed ?? null,
		},
	];
}

/**
 * Build the `post-attribute-set` operation for a proposed post title.
 *
 * @param proposal The title proposal.
 * @return Operations describing the suggestion (empty when nothing changed).
 */
export function postOperationsFromTitle(
	proposal: { baseline: string; proposed: string } | null | undefined
): SuggestionOperation[] {
	return postOperationsFromProposal(
		proposal ? { attribute: 'title', ...proposal } : null
	);
}

/**
 * Build attributes that clear the `metadata.suggestion` marker on a block
 * while preserving every other metadata field. Used by Apply (after the
 * mutation lands) and by Reject (to drop the pending state).
 *
 * A proposal that rode along on a structural marker goes with it: the
 * block's one note carried the structural op and the attribute ops
 * together, so the decision on that note resolved both.
 *
 * @param currentAttributes Block's current attributes.
 * @return Partial attributes payload safe for `updateBlockAttributes`.
 */
export function clearSuggestionMarkerAttributes(
	currentAttributes: Record< string, any > | null | undefined
): { metadata: Record< string, any > } | null {
	const meta = currentAttributes?.metadata;
	if ( ! meta || meta.suggestion === undefined ) {
		return null;
	}
	const { suggestion: _drop, ...rest } = meta;
	return { metadata: rest };
}

/**
 * Apply a suggestion payload's operations to a block's current attributes
 * to produce the new attributes. Pure function — no side effects.
 *
 * @param currentAttributes Block's current attributes.
 * @param operations        Operations from the payload.
 * @return Merged attributes with suggestions applied.
 */
export function applyOperations(
	currentAttributes: Record< string, any > | null | undefined,
	operations: SuggestionOperation[]
): Record< string, any > {
	const result: Record< string, any > = { ...currentAttributes };
	for ( const op of operations ) {
		if ( op.type === 'attribute-set' ) {
			result[ op.attribute ] = op.after;
		}
	}
	return result;
}

/**
 * The attributes that restore a block after `applyOperations`, covering
 * exactly the keys the apply touched. `updateBlockAttributes` is a partial
 * merge — passing the original attributes alone would leave keys that the
 * apply newly added stuck on the block (set to their `after` value), since
 * they have no entry in the original attributes to override them. Listing
 * each touched key with its original value (or `undefined` when the key was
 * added by the apply) restores the block cleanly.
 *
 * @param currentAttributes Block attributes before the apply.
 * @param operations        Operations the apply ran.
 * @return Partial attributes for `updateBlockAttributes`.
 */
export function rollbackAttributesFor(
	currentAttributes: Record< string, any > | null | undefined,
	operations: SuggestionOperation[]
): Record< string, any > {
	const rollback: Record< string, any > = {};
	for ( const op of operations ) {
		if ( op.type !== 'attribute-set' ) {
			continue;
		}
		rollback[ op.attribute ] = Object.prototype.hasOwnProperty.call(
			currentAttributes ?? {},
			op.attribute
		)
			? currentAttributes?.[ op.attribute ]
			: undefined;
	}
	return rollback;
}

/**
 * The post edits that accepting post-level operations makes.
 *
 * @param operations Post-level operations.
 * @return Edits for `editPost`.
 */
export function applyPostOperations(
	operations: SuggestionOperation[]
): Record< string, any > {
	const edits: Record< string, any > = {};
	for ( const op of findPostAttributeOps( operations ) ) {
		if ( op.attribute === 'meta' ) {
			// Meta edits merge into the post's meta, one key at a time.
			if ( typeof op.key === 'string' && op.key ) {
				edits.meta = { ...edits.meta, [ op.key ]: op.after };
			}
			continue;
		}
		edits[ op.attribute ] = op.after;
	}
	return edits;
}

/**
 * Report whether applying the suggestion's operations over the block's
 * current attributes would overwrite concurrent changes made by someone
 * else. A suggestion is considered conflicting only when the baseline
 * captured at suggest-time differs from the attribute's current value —
 * simply reopening the post after any auto-save doesn't qualify.
 *
 * @param currentAttributes Block's current attributes.
 * @param operations        Operations from the payload.
 * @return True if at least one targeted attribute has diverged.
 */
export function hasAttributeConflict(
	currentAttributes: Record< string, any > | null | undefined,
	operations: SuggestionOperation[] | null | undefined
): boolean {
	if ( ! Array.isArray( operations ) ) {
		return false;
	}
	// Inserted blocks have no pre-existing attributes — the overlay's
	// baseline for a `block-insert-after` entry is `{}`, so every
	// attribute-set op rides on `before: null`. Comparing that against the
	// live (already-typed-into) block's attributes always reads as
	// divergence, which falsely fires the staleness prompt on apply. The
	// attribute-set ops describe the inserted block's content, not an
	// overwrite of pre-existing data, so there is nothing to conflict with.
	if ( findStructuralOp( operations )?.type === 'block-insert-after' ) {
		return false;
	}
	for ( const op of operations ) {
		// Post-level ops compare against the post's fields, which the caller
		// passes as `currentAttributes` for such a payload.
		if (
			op.type !== 'attribute-set' &&
			op.type !== POST_ATTRIBUTE_OP_TYPE
		) {
			continue;
		}
		if (
			! isAttributeEqual(
				op.before ?? null,
				currentAttributes?.[ op.attribute ] ?? null
			)
		) {
			return true;
		}
	}
	return false;
}
