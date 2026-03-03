/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Hook to fetch notes counts for a list of post IDs.
 *
 * Notes are stored as comments with type 'note'.
 * This hook fetches all notes for the given posts and returns
 * a map of post ID to notes count.
 *
 * @param {number[]} postIds - Array of post IDs to fetch notes for.
 * @return {{ notesCount: Object, isResolving: boolean }} Object with notesCount map and loading state.
 */
export default function useNotesCount( postIds ) {
	const { records: notes, isResolving } = useEntityRecords(
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

	const notesCount = useMemo( () => {
		if ( ! notes || notes.length === 0 ) {
			return {};
		}

		const counts = {};
		notes.forEach( ( note ) => {
			const postId = note.post;
			counts[ postId ] = ( counts[ postId ] || 0 ) + 1;
		} );

		return counts;
	}, [ notes ] );

	return { notesCount, isResolving };
}
