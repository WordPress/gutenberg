import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * The fields requested for each note, as limited by `_fields`.
 */
type NoteRecord = {
	id: number;
	post: number;
};

/**
 * Hook to fetch notes counts for a list of post IDs.
 *
 * Notes are stored as comments with type 'note'.
 * This hook fetches all notes for the given posts and returns
 * a map of post ID to notes count.
 *
 * @param postIds Array of post IDs to fetch notes for.
 * @return Object with the notes count of each post, undefined until the
 *         counts arrive or when they fail to, and whether they are loading.
 */
export default function useNotesCount( postIds: number[] ): {
	notesCount: Record< number, number | undefined >;
	isLoading: boolean;
} {
	const { records: notes, hasResolved } = useEntityRecords< NoteRecord >(
		'root',
		'comment',
		{
			post: postIds,
			type: 'note',
			status: 'all',
			per_page: -1,
			_fields: 'id,post',
		},
		{
			enabled: postIds?.length > 0,
		}
	);

	// The query is idle for a render before it starts resolving, so wait for
	// it to resolve rather than only while it is resolving.
	const isLoading = postIds.length > 0 && ! hasResolved;

	const notesCount = useMemo( () => {
		// Still loading, or the request failed: the counts are unknown.
		if ( isLoading || ! notes ) {
			return {};
		}

		// Every requested post gets a count, 0 when it has no notes.
		const counts: Record< number, number > = {};
		postIds.forEach( ( postId ) => {
			counts[ postId ] = 0;
		} );
		notes.forEach( ( note ) => {
			if ( note.post in counts ) {
				counts[ note.post ]++;
			}
		} );

		return counts;
	}, [ isLoading, notes, postIds ] );

	return { notesCount, isLoading };
}
