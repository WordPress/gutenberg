import { SEARCH_RANK, searchItems } from '../../utils/search-ranking';

/**
 * Core blocks are ranked above third-party ones, and a core block is ranked
 * above its own variations. This only breaks ties between matches that are
 * otherwise equally good, so it can never pull a weak match to the top.
 *
 * @param {Object} item Inserter item.
 *
 * @return {number} Priority, higher wins.
 */
function getCorePriority( item ) {
	const name = item.name || '';

	if ( ! name.startsWith( 'core/' ) ) {
		return 0;
	}

	return name === item.id ? 2 : 1;
}

/**
 * Filters and ranks the inserter's block items against a search input.
 *
 * @param {Array}  items       Inserter items.
 * @param {Array}  categories  Block categories.
 * @param {Object} collections Block collections.
 * @param {string} searchInput Search input.
 *
 * @return {Array} Filtered and ranked item list.
 */
export const searchBlockItems = (
	items,
	categories,
	collections,
	searchInput
) => {
	const fields = [
		{ get: ( item ) => item.title },
		{ get: ( item ) => item.name, maxRank: SEARCH_RANK.WORD_STARTS_WITH },
		{
			get: ( item ) => item.keywords,
			maxRank: SEARCH_RANK.WORD_STARTS_WITH,
		},
		{
			get: ( item ) =>
				categories.find( ( { slug } ) => slug === item.category )
					?.title,
			maxRank: SEARCH_RANK.CONTAINS,
		},
		{
			get: ( item ) =>
				collections[ ( item.name || '' ).split( '/' )[ 0 ] ]?.title,
			maxRank: SEARCH_RANK.CONTAINS,
		},
		{ get: ( item ) => item.description, maxRank: SEARCH_RANK.CONTAINS },
	];

	return searchItems( items, searchInput, {
		fields,
		tiebreak: ( a, b ) => getCorePriority( b ) - getCorePriority( a ),
	} );
};
