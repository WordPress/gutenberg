import type { BlockCategory, BlockCollection } from '@wordpress/blocks';
import { SEARCH_RANK, searchItems } from '../../utils/search-ranking';
import type { InserterItem } from '../../store/types';

/**
 * The fields of an inserter item the search reads.
 */
type SearchableItem = Pick<
	InserterItem,
	'id' | 'name' | 'title' | 'keywords' | 'category' | 'description'
>;

/**
 * Core blocks are ranked above third-party ones, and a core block is ranked
 * above its own variations. This only breaks ties between matches that are
 * otherwise equally good, so it can never pull a weak match to the top.
 *
 * @param item Inserter item.
 *
 * @return Priority, higher wins.
 */
function getCorePriority( item: SearchableItem ): number {
	const name = item.name || '';

	if ( ! name.startsWith( 'core/' ) ) {
		return 0;
	}

	return name === item.id ? 2 : 1;
}

/**
 * Filters and ranks the inserter's block items against a search input.
 *
 * @param items       Inserter items.
 * @param categories  Block categories.
 * @param collections Block collections.
 * @param searchInput Search input.
 *
 * @return Filtered and ranked item list.
 */
export const searchBlockItems = < T extends SearchableItem >(
	items: T[],
	categories: BlockCategory[],
	collections: Record< string, BlockCollection >,
	searchInput: string
): T[] => {
	const fields = [
		{ get: ( item: T ) => item.title },
		{
			get: ( item: T ) => item.name,
			maxRank: SEARCH_RANK.WORD_STARTS_WITH,
		},
		{
			get: ( item: T ) => item.keywords,
			maxRank: SEARCH_RANK.WORD_STARTS_WITH,
		},
		{
			get: ( item: T ) =>
				categories.find( ( { slug } ) => slug === item.category )
					?.title,
			maxRank: SEARCH_RANK.CONTAINS,
		},
		{
			get: ( item: T ) =>
				collections[ ( item.name || '' ).split( '/' )[ 0 ] ]?.title,
			maxRank: SEARCH_RANK.CONTAINS,
		},
		{ get: ( item: T ) => item.description, maxRank: SEARCH_RANK.CONTAINS },
	];

	return searchItems( items, searchInput, {
		fields,
		tiebreak: ( a, b ) => getCorePriority( b ) - getCorePriority( a ),
	} );
};
