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
 * @return Object with notesCount map and loading state.
 */
export default function useNotesCount( postIds: number[] ): {
	notesCount: Record< number, number >;
	isResolving: boolean;
} {
	const { records: notes, isResolving } = useEntityRecords< NoteRecord >(
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

		const counts: Record< number, number > = {};
		notes.forEach( ( note ) => {
			const postId = note.post;
			counts[ postId ] = ( counts[ postId ] || 0 ) + 1;
		} );

		return counts;
	}, [ notes ] );

	return { notesCount, isResolving };
}
