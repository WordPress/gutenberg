import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Hook to fetch notes counts for a list of post IDs.
 *
 * The notes endpoint returns one record per thread, so the per-post total is
 * the number of threads plus the replies they report. `_fields` keeps the
 * response to the three values the tally needs rather than whole threads.
 *
 * `reply_count` covers replies someone wrote; resolving or reopening a thread
 * records a reply of its own that the endpoint leaves out, so a thread nobody
 * answered counts as one however many times it changed hands.
 *
 * @param {number[]} postIds - Array of post IDs to fetch notes for.
 * @return {{ notesCount: Object, isResolving: boolean }} Object with notesCount map and loading state.
 */
export default function useNotesCount( postIds ) {
	const { records: notes, isResolving } = useEntityRecords(
		'commentType',
		'note',
		{
			post: postIds,
			per_page: -1,
			_fields: 'id,post,reply_count',
		},
		{
			enabled: postIds?.length > 0,
		}
	);

	const notesCount = useMemo( () => {
		if ( ! notes || notes.length === 0 ) {
			return {};
		}

		const counts = {};
		notes.forEach( ( note ) => {
			const postId = note.post;
			counts[ postId ] =
				( counts[ postId ] || 0 ) + 1 + ( note.reply_count ?? 0 );
		} );

		return counts;
	}, [ notes ] );

	return { notesCount, isResolving };
}
