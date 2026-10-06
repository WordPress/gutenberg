/**
 * Emoji reactions on blocks.
 *
 * A reaction is a `reaction` comment. On a note it hangs off the note as its
 * `parent`; on a block it is a top-level row anchored to the block through a
 * short id the editor mints into the block's `metadata.reactionsId` on the
 * first reaction, mirroring how notes anchor through `metadata.noteId`. The
 * server returns every block reaction on a post as one summary keyed by that
 * anchor, carried on the post record as `block_reaction_summary`.
 */

/**
 * What a reaction hangs off: a note, or a block within a post.
 */
export type ReactionTarget =
	| { kind: 'note'; id: number }
	| { kind: 'block'; postId: number; reactionsId: string };

export interface ReactionSummaryEntry {
	count: number;
	// The current user's reaction comment ID, used to delete it again;
	// 0 when they have not reacted with this emoji.
	current_user_reaction: number;
}

/**
 * A reaction summary keyed by emoji hex key.
 */
export type ReactionSummary = Record< string, ReactionSummaryEntry >;

/**
 * Every block's reaction summary on a post, keyed by block anchor.
 */
export type BlockReactionSummary = Record< string, ReactionSummary >;

/**
 * Request and query parameter naming the block anchor.
 */
export const BLOCK_REACTION_PARAM = 'block';

/**
 * Shape the server accepts for a block anchor.
 */
const REACTIONS_ID_PATTERN = /^[a-z0-9]{6,16}$/;

/**
 * Mints a block anchor: eight lowercase base-36 characters.
 *
 * @return A fresh anchor matching `REACTIONS_ID_PATTERN`.
 */
export function generateReactionsId(): string {
	const BASE36 = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = globalThis.crypto.getRandomValues( new Uint8Array( 8 ) );
	return Array.from( bytes, ( byte ) => BASE36[ byte % 36 ] ).join( '' );
}

/**
 * Reads a block's reaction anchor from its metadata, if it carries a
 * well-formed one.
 *
 * @param metadata The block's `metadata` attribute.
 * @return The anchor, or `undefined`.
 */
export function getBlockReactionsId(
	metadata: { reactionsId?: unknown } | undefined | null
): string | undefined {
	const value = metadata?.reactionsId;
	return typeof value === 'string' && REACTIONS_ID_PATTERN.test( value )
		? value
		: undefined;
}

/**
 * Folds a completed reaction toggle into a summary.
 *
 * Keeps a cached summary usable when the refetch that would normally
 * replace it fails: without it, the next toggle reads a stale
 * `current_user_reaction` and takes the wrong branch.
 *
 * @param summary         The cached summary.
 * @param hexKey          The reaction hex key that changed.
 * @param addedReactionId The new reaction's comment ID when one was added;
 *                        omitted when one was removed.
 * @return A new summary, or the given one when nothing changed.
 */
export function applyReactionSummaryDelta(
	summary: ReactionSummary | null | undefined,
	hexKey: string,
	addedReactionId?: number
): ReactionSummary {
	const entry = summary?.[ hexKey ];
	// Concurrent adds converge server-side on one surviving row, so a
	// repeated ID is already counted.
	if ( addedReactionId && entry?.current_user_reaction === addedReactionId ) {
		return summary as ReactionSummary;
	}

	const next = { ...( summary || {} ) };
	if ( addedReactionId ) {
		next[ hexKey ] = {
			count: ( entry?.count || 0 ) + 1,
			current_user_reaction: addedReactionId,
		};
	} else if ( entry ) {
		const count = entry.count - 1;
		if ( count > 0 ) {
			next[ hexKey ] = { count, current_user_reaction: 0 };
		} else {
			delete next[ hexKey ];
		}
	}

	return next;
}

/**
 * A stable string for a target, used as a cache key.
 *
 * @param target The reaction target.
 * @return The key.
 */
export function getReactionTargetKey( target: ReactionTarget ): string {
	return target.kind === 'note'
		? `note:${ target.id }`
		: `block:${ target.postId }:${ target.reactionsId }`;
}

/**
 * Query arguments listing every reaction on a target.
 *
 * @param target The reaction target.
 * @return Arguments for `GET /wp/v2/comments`.
 */
export function getReactionsQueryArgs(
	target: ReactionTarget
): Record< string, string | number > {
	if ( target.kind === 'note' ) {
		return { parent: target.id, type: 'reaction', status: 'all' };
	}
	return {
		post: target.postId,
		parent: 0,
		[ BLOCK_REACTION_PARAM ]: target.reactionsId,
		type: 'reaction',
		status: 'all',
	};
}

/**
 * The sidebar entry type for a block that has reactions but no note.
 */
const BLOCK_REACTIONS_ENTRY_TYPE = 'block-reactions';

/**
 * The id of the sidebar entry for a block with reactions but no note.
 *
 * @param clientId The block client id.
 * @return The entry id.
 */
export function getBlockReactionsEntryId( clientId: string ): string {
	return `block-reactions-${ clientId }`;
}

/**
 * Whether a sidebar thread is the entry for a block with reactions but no
 * note.
 *
 * @param thread A thread from the notes list.
 * @return True for a block-reactions entry.
 */
export function isBlockReactionsEntry(
	thread: { type?: string } | null | undefined
): boolean {
	return thread?.type === BLOCK_REACTIONS_ENTRY_TYPE;
}

export interface SidebarThread {
	id: number | string;
	blockClientId?: string | null;
	[ key: string ]: unknown;
}

export interface SidebarThreads {
	notes: SidebarThread[];
	unresolvedNotes: SidebarThread[];
}

/**
 * Adds block reactions to the sidebar's thread list.
 *
 * A block's reactions row rides on the block's first unresolved thread,
 * flagged `hasBlockReactions`. The floating view lists only unresolved
 * threads, so a block with no unresolved note gets an entry of its own,
 * placed among the unresolved threads in document order. An anchor whose
 * block is gone is not listed: a reaction carries no content worth keeping
 * in view, and undo restores the block with its anchor.
 *
 * @param threads            `notes` (unresolved, orphans, resolved) and
 *                           `unresolvedNotes` from `useNoteThreads`.
 * @param summary            Every block's reaction summary on the post.
 * @param clientIds          Every block client id, in document order.
 * @param getBlockAttributes Block-editor selector.
 * @param reactingClientId   A block the user is reacting to from the
 *                           toolbar, listed before its first reaction.
 * @return The lists with block reactions added.
 */
export function addBlockReactionEntries(
	threads: SidebarThreads,
	summary: BlockReactionSummary,
	clientIds: string[],
	getBlockAttributes: (
		clientId: string
	) => { metadata?: { reactionsId?: unknown } } | null | undefined,
	reactingClientId?: string
): SidebarThreads {
	if ( ! Object.keys( summary ).length && ! reactingClientId ) {
		return threads;
	}

	const unresolved = [ ...threads.unresolvedNotes ];
	const blockIndex = new Map< string, number >();
	clientIds.forEach( ( clientId, index ) => {
		blockIndex.set( clientId, index );
		const reactionsId = getBlockReactionsId(
			getBlockAttributes( clientId )?.metadata
		);
		const hasReactions = !! reactionsId && !! summary[ reactionsId ];
		if ( ! hasReactions && clientId !== reactingClientId ) {
			return;
		}
		const threadIndex = unresolved.findIndex(
			( thread ) => thread.blockClientId === clientId
		);
		if ( threadIndex !== -1 ) {
			unresolved[ threadIndex ] = {
				...unresolved[ threadIndex ],
				hasBlockReactions: true,
			};
		} else {
			unresolved.push( {
				id: getBlockReactionsEntryId( clientId ),
				type: BLOCK_REACTIONS_ENTRY_TYPE,
				parent: 0,
				status: 'hold',
				blockClientId: clientId,
				reply: [],
			} );
		}
	} );
	// A stable sort, so threads on one block keep their order.
	unresolved.sort(
		( a, b ) =>
			( blockIndex.get( a.blockClientId ?? '' ) ?? 0 ) -
			( blockIndex.get( b.blockClientId ?? '' ) ?? 0 )
	);

	return {
		notes: [
			...unresolved,
			// Orphans and resolved threads, as they were.
			...threads.notes.slice( threads.unresolvedNotes.length ),
		],
		unresolvedNotes: unresolved,
	};
}
