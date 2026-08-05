/**
 * Stable block identity (syncId) — prototype client minting.
 *
 * Fills `metadata.syncId` for any block that lacks one and re-mints when two
 * blocks carry the same ID (block duplication copies `metadata` wholesale, so
 * a duplicate would otherwise share its source's identity). The `metadata`
 * attribute serializes into the block comment delimiter, so IDs persist with
 * content, survive kses, and are visible to the server-side engine.
 *
 * Two-regime minting per the sync spec: random IDs at creation (this file),
 * deterministic genesis IDs computed from a saved revision for legacy blocks
 * (NOT implemented here — it needs revision plumbing and the PHP hash twin;
 * the frozen cross-language vectors live in the sync prototype's
 * test-vectors/sync-id.json). Until then, legacy blocks receive random IDs on
 * first load, which stabilize once saved. Two clients that both open a
 * never-saved legacy post will disagree until the first save wins — an
 * accepted prototype limitation.
 *
 * Deliberately build-free: uses WordPress script globals so the prototype
 * stays inside lib/experimental/ without touching the packages build.
 */

/* global wp */
( function () {
	const { select, dispatch, subscribe } = wp.data;

	/**
	 * Random syncId for a block born (or first observed) in this session.
	 *
	 * @return {string} Opaque syncId.
	 */
	function mintSyncId() {
		return crypto.randomUUID();
	}

	let scheduled = false;

	/**
	 * Collects blocks missing a `metadata.syncId` and blocks whose ID
	 * duplicates an earlier one (all but the first holder).
	 *
	 * @return {Array<[string, Object]>} Pairs of [clientId, existing metadata].
	 */
	function collectUpdates() {
		const blockEditor = select( 'core/block-editor' );
		if ( ! blockEditor ) {
			return [];
		}
		const seen = new Set();
		const updates = [];
		for ( const clientId of blockEditor.getClientIdsWithDescendants() ) {
			const attributes = blockEditor.getBlockAttributes( clientId );
			if ( ! attributes ) {
				continue;
			}
			const syncId = attributes.metadata?.syncId;
			if ( ! syncId || seen.has( syncId ) ) {
				updates.push( [ clientId, attributes.metadata ] );
			} else {
				seen.add( syncId );
			}
		}
		return updates;
	}

	/**
	 * Assigns missing/duplicated syncIds.
	 *
	 * Runs deferred (never synchronously inside the store-change tick that
	 * scheduled it) and never while a save is in flight: dispatching a block
	 * mutation into the middle of a save's serialization races with it and can
	 * drop the very edit being saved. Deferring to a microtask also avoids
	 * re-entrant store updates from within the subscribe callback.
	 */
	function flushSyncIds() {
		scheduled = false;

		const editor = select( 'core/editor' );
		if (
			editor &&
			( editor.isSavingPost() || editor.isAutosavingPost() )
		) {
			// Reschedule for after the save settles.
			schedule();
			return;
		}

		const updates = collectUpdates();
		if ( ! updates.length ) {
			return;
		}

		const editorDispatch = dispatch( 'core/block-editor' );
		for ( const [ clientId, metadata ] of updates ) {
			// Identity assignment is bookkeeping, not an edit — keep it out of
			// the undo stack.
			editorDispatch.__unstableMarkNextChangeAsNotPersistent();
			editorDispatch.updateBlockAttributes( clientId, {
				metadata: { ...( metadata || {} ), syncId: mintSyncId() },
			} );
		}
	}

	function schedule() {
		if ( scheduled ) {
			return;
		}
		scheduled = true;
		Promise.resolve().then( flushSyncIds );
	}

	subscribe( schedule, 'core/block-editor' );
} )();
