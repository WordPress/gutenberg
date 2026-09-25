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
	reacted?: boolean;
	// The current user's reaction comment ID, used to delete it again.
	my_reaction_id?: number;
}

/**
 * A reaction summary keyed by storage slug (curated slug or hex key).
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
export const REACTIONS_ID_PATTERN = /^[a-z0-9]{6,16}$/;

const REACTIONS_ID_LENGTH = 8;
const BASE36 = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Mints a block anchor: eight lowercase base-36 characters.
 *
 * Uses the Web Crypto API when it is there (it is, in any secure or
 * insecure browsing context), and falls back to `Math.random` otherwise.
 *
 * @return A fresh anchor matching `REACTIONS_ID_PATTERN`.
 */
export function generateReactionsId(): string {
	const cryptoApi = globalThis.crypto;
	if ( cryptoApi?.getRandomValues ) {
		const bytes = cryptoApi.getRandomValues(
			new Uint8Array( REACTIONS_ID_LENGTH )
		);
		return Array.from( bytes, ( byte ) => BASE36[ byte % 36 ] ).join( '' );
	}

	let id = '';
	while ( id.length < REACTIONS_ID_LENGTH ) {
		id += Math.random().toString( 36 ).slice( 2 );
	}
	return id.slice( 0, REACTIONS_ID_LENGTH );
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
 * Returns the metadata with a reaction anchor added.
 *
 * @param metadata    The block's current `metadata` attribute.
 * @param reactionsId The anchor to write.
 * @return Updated metadata.
 */
export function addReactionsIdToMetadata(
	metadata: Record< string, unknown > | undefined | null,
	reactionsId: string
): Record< string, unknown > {
	return { ...( metadata ?? {} ), reactionsId };
}

interface EnsureBlockReactionsIdRegistry {
	getBlockAttributes: (
		clientId: string
	) => Record< string, any > | null | undefined;
	updateBlockAttributes: (
		clientId: string,
		attributes: Record< string, unknown >
	) => void;
	cleanEmptyObject: < T >( object: T ) => T | undefined;
	generateId?: () => string;
}

/**
 * Returns the block's reaction anchor, minting and writing one when the
 * block has none.
 *
 * The write is synchronous so two toggles in quick succession share one
 * anchor. Like the first note on a block, it makes the post dirty until
 * saved; a reaction created before that save is orphaned if the save never
 * happens, which is the same trade-off notes already make.
 *
 * @param clientId                       The block client id.
 * @param registry                       Block-editor selectors and actions.
 * @param registry.getBlockAttributes    Block-editor selector.
 * @param registry.updateBlockAttributes Block-editor action.
 * @param registry.cleanEmptyObject      Drops empty metadata objects.
 * @param registry.generateId            Anchor generator, overridable in tests.
 * @return The anchor.
 */
export function ensureBlockReactionsId(
	clientId: string,
	{
		getBlockAttributes,
		updateBlockAttributes,
		cleanEmptyObject,
		generateId = generateReactionsId,
	}: EnsureBlockReactionsIdRegistry
): string {
	const metadata = getBlockAttributes( clientId )?.metadata;
	const existing = getBlockReactionsId( metadata );
	if ( existing ) {
		return existing;
	}

	const reactionsId = generateId();
	updateBlockAttributes( clientId, {
		metadata: cleanEmptyObject(
			addReactionsIdToMetadata( metadata, reactionsId )
		),
	} );
	return reactionsId;
}

/**
 * Folds a completed reaction toggle into a summary.
 *
 * Keeps a cached summary usable when the refetch that would normally
 * replace it fails: without it, the next toggle reads a stale `reacted` /
 * `my_reaction_id` pair and takes the wrong branch.
 *
 * @param summary         The cached summary.
 * @param slug            The reaction storage slug that changed.
 * @param addedReactionId The new reaction's comment ID when one was added;
 *                        omitted when one was removed.
 * @return A new summary.
 */
export function applyReactionSummaryDelta(
	summary: ReactionSummary | null | undefined,
	slug: string,
	addedReactionId?: number
): ReactionSummary {
	const next = { ...( summary || {} ) };
	const entry = next[ slug ];

	if ( addedReactionId ) {
		next[ slug ] = {
			count: ( entry?.count || 0 ) + 1,
			reacted: true,
			my_reaction_id: addedReactionId,
		};
	} else if ( entry ) {
		const count = entry.count - 1;
		if ( count > 0 ) {
			next[ slug ] = { count, reacted: false };
		} else {
			delete next[ slug ];
		}
	}

	return next;
}

/**
 * Folds a completed block reaction toggle into a post's block summary.
 *
 * @param blockSummary    The cached summary for every block.
 * @param reactionsId     The block anchor that changed.
 * @param slug            The reaction storage slug that changed.
 * @param addedReactionId The new reaction's comment ID when one was added.
 * @return A new block summary; untouched anchors keep their identity.
 */
export function applyBlockReactionDelta(
	blockSummary: BlockReactionSummary | null | undefined,
	reactionsId: string,
	slug: string,
	addedReactionId?: number
): BlockReactionSummary {
	const next = { ...( blockSummary || {} ) };
	const summary = applyReactionSummaryDelta(
		next[ reactionsId ],
		slug,
		addedReactionId
	);

	if ( Object.keys( summary ).length > 0 ) {
		next[ reactionsId ] = summary;
	} else {
		delete next[ reactionsId ];
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
export const BLOCK_REACTIONS_ENTRY_TYPE = 'block-reactions';

/**
 * Whether a sidebar thread is the synthetic block-reactions entry.
 *
 * @param thread A thread from the notes list.
 * @return True for a block-reactions entry.
 */
export function isBlockReactionsEntry(
	thread: { type?: string } | null | undefined
): boolean {
	return thread?.type === BLOCK_REACTIONS_ENTRY_TYPE;
}

/**
 * The thread id of a block's synthetic reactions entry.
 *
 * @param reactionsId The block anchor.
 * @return The entry id.
 */
export function getBlockReactionsEntryId( reactionsId: string ): string {
	return `block-reactions:${ reactionsId }`;
}
