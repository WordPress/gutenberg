import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import {
	materializeNoteThreads,
	partitionNoteThreadsByStatus,
} from '../../collab-sidebar/utils';
import { countThreadsByAnchor, groupThreadsByAnchor } from './anchors';
import type { StyleBookNoteGroup, StyleBookNoteThread } from './anchors';

/*
 * A fresh `{}` default would give `labels` a new identity on every call, which
 * defeats the memo below - and with it the memoized `Examples` tree, which
 * re-renders every block preview in the Style Book.
 */
const EMPTY_LABELS: Record< string, string > = {};

type UseStyleBookNoteThreadsOptions = {
	enabled?: boolean;
	labels?: Record< string, string >;
};

type UseStyleBookNoteThreadsResult = {
	// `core-data` types the global styles id as a string, though the value it
	// resolves is the `wp_global_styles` post id.
	globalStylesId: number | string | undefined;
	groups: StyleBookNoteGroup[];
	counts: Record< string, number >;
	threads: StyleBookNoteThread[];
};

/**
 * Loads the Style Book notes for the active theme and arranges them by the
 * example each was left on.
 *
 * Notes live on the user `wp_global_styles` post, so there is one set per
 * theme. The id is the one the Styles screens already resolve, which means no
 * extra request for it; the comment query is the single request this adds, and
 * it is skipped entirely until that id is known.
 *
 * @param options
 * @param options.enabled Whether to fetch at all.
 * @param options.labels  Example name to display title.
 * @return Grouped threads, per-example counts and the post they are stored on.
 */
export function useStyleBookNoteThreads( {
	enabled = true,
	labels = EMPTY_LABELS,
}: UseStyleBookNoteThreadsOptions = {} ): UseStyleBookNoteThreadsResult {
	const globalStylesId = useSelect(
		( select ) =>
			select( coreStore ).__experimentalGetCurrentGlobalStylesId(),
		[]
	);

	const { records } = useEntityRecords(
		'root',
		'comment',
		{
			post: globalStylesId,
			type: 'note',
			status: 'all',
			per_page: -1,
		},
		{ enabled: enabled && !! globalStylesId }
	);

	const { groups, counts, threads } = useMemo( () => {
		if ( ! records?.length ) {
			return {
				groups: [] as StyleBookNoteGroup[],
				counts: {} as Record< string, number >,
				threads: [] as StyleBookNoteThread[],
			};
		}

		const { rootThreads } = materializeNoteThreads( records );

		/*
		 * Unresolved threads sort ahead of resolved ones within each example,
		 * matching the post editor, where resolved notes collect at the bottom
		 * of the list. Grouping happens after the sort so each group inherits
		 * the ordering rather than repeating it.
		 */
		const { unresolved, resolved } =
			partitionNoteThreadsByStatus( rootThreads );
		const ordered = [ ...unresolved, ...resolved ];

		return {
			groups: groupThreadsByAnchor( ordered, labels ),
			counts: countThreadsByAnchor( ordered ),
			threads: ordered,
		};
	}, [ records, labels ] );

	return { globalStylesId, groups, counts, threads };
}
