// `date_gmt` is a fixed-width `Y-m-d\TH:i:s` string, so the helpers below
// compare timestamps as strings. Parsing them as `Date` would read them as
// local time.

/**
 * A note or reply, with only the fields the unseen-activity checks read.
 */
export interface NoteActivity {
	author?: number;
	date_gmt?: string;
	reply?: NoteActivity[];
}

/**
 * Returns the newest `date_gmt` across the given note threads and their replies.
 *
 * @param threads Note threads, each optionally carrying a `reply` array.
 * @return Newest `date_gmt` found, or `null` when there is none.
 */
export function getLatestNoteActivity(
	threads: NoteActivity[] | null | undefined
): string | null {
	let latest: string | null = null;
	for ( const thread of threads ?? [] ) {
		for ( const entry of [ thread, ...( thread?.reply ?? [] ) ] ) {
			const date = entry?.date_gmt;
			if ( date && ( latest === null || date > latest ) ) {
				latest = date;
			}
		}
	}
	return latest;
}

/**
 * Whether any of the threads, or their replies, has activity by somebody other
 * than the current user since `lastSeen`.
 *
 * @param threads       Note threads, each optionally carrying a `reply` array.
 * @param lastSeen      `date_gmt` the user last saw the post's notes, if ever.
 * @param currentUserId Current user id. Without it nothing counts.
 * @return Whether there is unseen activity.
 */
export function hasUnseenNoteActivity(
	threads: NoteActivity[] | null | undefined,
	lastSeen: string | null | undefined,
	currentUserId: number | null | undefined
): boolean {
	if ( ! currentUserId ) {
		return false;
	}
	return ( threads ?? [] ).some( ( thread ) =>
		[ thread, ...( thread?.reply ?? [] ) ].some(
			( entry ) =>
				!! entry?.date_gmt &&
				entry.author !== currentUserId &&
				( ! lastSeen || entry.date_gmt > lastSeen )
		)
	);
}

/**
 * Records a post's "notes last seen" timestamp, keeping only the `limit` most
 * recently seen posts.
 *
 * @param lastSeen  Existing `{ [ postId ]: date_gmt }` map.
 * @param postId    Post the timestamp belongs to.
 * @param timestamp Newest `date_gmt` the user has been shown.
 * @param limit     How many posts to keep.
 * @return New map.
 */
export function setNotesLastSeen(
	lastSeen: Record< string, string > | null | undefined,
	postId: number,
	timestamp: string,
	limit: number
): Record< string, string > {
	const entries = Object.entries( { ...lastSeen, [ postId ]: timestamp } );
	if ( entries.length <= limit ) {
		return Object.fromEntries( entries );
	}
	entries.sort( ( [ , a ], [ , b ] ) => b.localeCompare( a ) );
	return Object.fromEntries( entries.slice( 0, limit ) );
}
