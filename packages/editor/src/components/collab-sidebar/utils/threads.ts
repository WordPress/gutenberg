/**
 * A note comment, with only the fields thread building reads.
 */
export interface NoteComment {
	id: number;
	parent: number;
	status?: string;
	[ key: string ]: unknown;
}

export type MaterializedNoteThread< T extends NoteComment = NoteComment > =
	T & {
		reply: MaterializedNoteThread< T >[];
	};

/**
 * Turns the flat comment list the REST endpoint returns into threads: one
 * object per comment, with replies nested under their root.
 *
 * Anchoring is deliberately left to the caller. Notes in the post editor anchor
 * to a block through the block's `metadata.noteId` attribute, while Style Book
 * notes anchor to an example name held in comment meta; only the roots/replies
 * shape is common to both.
 *
 * Replies are unshifted rather than pushed because the comments endpoint
 * returns newest first and threads read oldest first.
 *
 * @param comments Flat list of note comments.
 * @return Threads indexed by comment id, and the top-level threads in source
 *         order.
 */
export function materializeNoteThreads< T extends NoteComment >(
	comments: T[]
): {
	threadsById: Map< number, MaterializedNoteThread< T > >;
	rootThreads: MaterializedNoteThread< T >[];
} {
	const threadsById = new Map< number, MaterializedNoteThread< T > >();
	const rootThreads: MaterializedNoteThread< T >[] = [];

	for ( const item of comments ) {
		const thread = { ...item, reply: [] } as MaterializedNoteThread< T >;
		threadsById.set( item.id, thread );
		if ( item.parent === 0 ) {
			rootThreads.push( thread );
		}
	}

	for ( const item of comments ) {
		if ( item.parent !== 0 ) {
			// A reply whose root is gone from the response is dropped rather
			// than surfaced parentless.
			const reply = threadsById.get( item.id );
			if ( reply ) {
				threadsById.get( item.parent )?.reply.unshift( reply );
			}
		}
	}

	return { threadsById, rootThreads };
}

/**
 * Splits threads into unresolved and resolved buckets, preserving the incoming
 * order within each. Threads in any other status (spam, trash) belong to
 * neither and are dropped.
 *
 * @param threads Ordered list of thread objects.
 * @return Partitioned threads.
 */
export function partitionNoteThreadsByStatus< T extends { status?: string } >(
	threads: T[]
): { unresolved: T[]; resolved: T[] } {
	const unresolved: T[] = [];
	const resolved: T[] = [];

	for ( const thread of threads ) {
		if ( thread.status === 'hold' ) {
			unresolved.push( thread );
		} else if ( thread.status === 'approved' ) {
			resolved.push( thread );
		}
	}

	return { unresolved, resolved };
}
