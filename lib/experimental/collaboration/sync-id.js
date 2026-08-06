/**
 * Stable block identity (syncId) — client minting, two regimes.
 *
 * Fills `metadata.syncId` for any block that lacks one and re-mints when two
 * blocks carry the same ID (block duplication copies `metadata` wholesale, so
 * a duplicate would otherwise share its source's identity). The `metadata`
 * attribute serializes into the block comment delimiter, so IDs persist with
 * content, survive kses, and are visible to the server-side engine.
 *
 * Two-regime minting per the sync spec:
 *
 * - GENESIS (deterministic): blocks of a freshly loaded, unedited post get
 *   ids computed from (postId, 0, block path) — the exact function the
 *   server's room genesis uses (WP_Intent_Log_Planner::genesis_sync_id;
 *   frozen cross-language vectors in the sync package's
 *   test-vectors/sync-id.json). Every independent minter — each open tab,
 *   the server, a tab that never connects — derives the SAME ids from the
 *   same saved content, so identity agreement needs no adoption heuristics
 *   and survives sessions.
 * - CREATION (random): blocks born during the session (insert, paste,
 *   split, duplicate re-mints) get random ids — each creation event is a
 *   distinct identity; this is what preserves both users' paragraphs when
 *   they concurrently insert at the same position.
 *
 * The genesis regime applies only to the first populated pass over a
 * pristine (not-yet-dirty) editor; if the user edited before the first pass,
 * every unstamped block falls back to random minting and the capture
 * bridge's identity adoption reconciles as before (the safety net stays).
 * Known limitation: classic (freeform) content occupies a path index in the
 * editor but not in the server's parse — such posts fall back to adoption.
 *
 * Deliberately build-free: uses WordPress script globals so the prototype
 * stays inside lib/experimental/ without touching the packages build.
 */

/* global wp */
( function () {
	const { select, dispatch, subscribe } = wp.data;

	/**
	 * Random syncId for a block born (or first observed dirty) in this
	 * session.
	 *
	 * @return {string} Opaque syncId.
	 */
	function mintSyncId() {
		return crypto.randomUUID();
	}

	/**
	 * Deterministic genesis syncId — the WebCrypto mirror of the engine's
	 * genesisSyncId()/genesis_sync_id(): sha256 of `postId:0:path`, first 16
	 * digest bytes, base64url without padding (22 chars).
	 *
	 * @param {number}   postId Post ID.
	 * @param {number[]} path   Block path (child indices from the root).
	 * @return {Promise<string>} 22-character base64url syncId.
	 */
	async function genesisSyncId( postId, path ) {
		const input = postId + ':0:' + path.join( '.' );
		const digest = new Uint8Array(
			await crypto.subtle.digest(
				'SHA-256',
				new TextEncoder().encode( input )
			)
		);
		let binary = '';
		for ( let i = 0; i < 16; i++ ) {
			binary += String.fromCharCode( digest[ i ] );
		}
		return btoa( binary )
			.replace( /\+/g, '-' )
			.replace( /\//g, '_' )
			.replace( /=+$/, '' );
	}

	let scheduled = false;
	let flushing = false;
	let regimeDecided = false;

	/**
	 * Collects blocks missing a `metadata.syncId` and blocks whose ID
	 * duplicates an earlier one (all but the first holder), with each
	 * block's tree path for genesis derivation.
	 *
	 * @return {Array<Object>} { clientId, metadata, path, duplicate } rows.
	 */
	function collectUpdates() {
		const blockEditor = select( 'core/block-editor' );
		if ( ! blockEditor ) {
			return [];
		}
		const seen = new Set();
		const updates = [];
		( function walk( rootClientId, path ) {
			const order = blockEditor.getBlockOrder( rootClientId );
			for ( let index = 0; index < order.length; index++ ) {
				const clientId = order[ index ];
				const blockPath = path.concat( index );
				const attributes = blockEditor.getBlockAttributes( clientId );
				if ( attributes ) {
					const syncId = attributes.metadata?.syncId;
					if ( ! syncId || seen.has( syncId ) ) {
						updates.push( {
							clientId,
							metadata: attributes.metadata,
							path: blockPath,
							// A duplicate is a creation event (the copy is a
							// new block), never a genesis candidate.
							duplicate: !! syncId,
						} );
					} else {
						seen.add( syncId );
					}
				}
				walk( clientId, blockPath );
			}
		} )( '', [] );
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
	async function flushSyncIds() {
		scheduled = false;
		if ( flushing ) {
			// A previous flush is awaiting its digests; rerun after it.
			schedule();
			return;
		}

		const editor = select( 'core/editor' );
		if (
			editor &&
			( editor.isSavingPost() || editor.isAutosavingPost() )
		) {
			// Reschedule for after the save settles.
			schedule();
			return;
		}

		/*
		 * Regime decision, made once, on the first pass that sees blocks: a
		 * pristine editor's unstamped blocks are the saved revision's blocks
		 * (genesis regime); anything unstamped after that — or after the
		 * user already edited — was created in-session (random regime).
		 */
		const blockEditor = select( 'core/block-editor' );
		const hasBlocks = ( blockEditor?.getBlockCount() ?? 0 ) > 0;
		const postId = editor?.getCurrentPostId?.();
		const useGenesis =
			! regimeDecided &&
			hasBlocks &&
			!! postId &&
			! editor?.isEditedPostDirty?.() &&
			!! crypto.subtle;
		if ( hasBlocks ) {
			regimeDecided = true;
		}

		const updates = collectUpdates();
		if ( ! updates.length ) {
			return;
		}

		flushing = true;
		try {
			const assignments = await Promise.all(
				updates.map( async ( update ) => ( {
					clientId: update.clientId,
					syncId:
						useGenesis && ! update.duplicate
							? await genesisSyncId( postId, update.path )
							: mintSyncId(),
				} ) )
			);

			// The digest hop is asynchronous: re-check the save guard and
			// re-read each block's current metadata before dispatching.
			if (
				editor &&
				( editor.isSavingPost() || editor.isAutosavingPost() )
			) {
				schedule();
				return;
			}
			const editorDispatch = dispatch( 'core/block-editor' );
			for ( const { clientId, syncId } of assignments ) {
				const attributes = blockEditor?.getBlockAttributes( clientId );
				if ( ! attributes || attributes.metadata?.syncId === syncId ) {
					continue; // Removed mid-flight, or already converged.
				}
				// Identity assignment is bookkeeping, not an edit — keep it
				// out of the undo stack.
				editorDispatch.__unstableMarkNextChangeAsNotPersistent();
				editorDispatch.updateBlockAttributes( clientId, {
					metadata: { ...( attributes.metadata || {} ), syncId },
				} );
			}
		} finally {
			flushing = false;
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
