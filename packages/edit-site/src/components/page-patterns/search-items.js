import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import {
	TEMPLATE_PART_ALL_AREAS_CATEGORY,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const { SEARCH_RANK, searchItems: searchAndRankItems } = unlock(
	blockEditorPrivateApis
);

const getName = ( item ) => {
	if ( item.type === PATTERN_TYPES.user ) {
		return item.slug;
	}

	if ( item.type === TEMPLATE_PART_POST_TYPE ) {
		return '';
	}

	return item.name;
};

const getTitle = ( item ) => {
	if ( typeof item.title === 'string' ) {
		return item.title;
	}

	return item.title?.rendered || item.title?.raw;
};

const getDescription = ( item ) => {
	if ( item.type === PATTERN_TYPES.user ) {
		return item.excerpt?.raw;
	}

	return item.description;
};

const PATTERN_FIELDS = [
	{ get: getTitle },
	{ get: getName, maxRank: SEARCH_RANK.WORD_STARTS_WITH },
	{ get: ( item ) => item.keywords, maxRank: SEARCH_RANK.WORD_STARTS_WITH },
	{ get: getDescription, maxRank: SEARCH_RANK.CONTAINS },
];

/**
 * Filters a pattern list by category, then ranks what is left by a search term.
 *
 * @param {Array}  items       Item list.
 * @param {string} searchInput Search input.
 * @param {Object} config      Category config.
 *
 * @return {Array} Filtered item list.
 */
export const searchItems = ( items = [], searchInput = '', config = {} ) => {
	const { categoryId, hasCategory = () => false } = config;

	// Category membership decides whether an item is eligible at all, so it is
	// a filter rather than part of the rank.
	const filter = ( item ) =>
		categoryId === PATTERN_DEFAULT_CATEGORY ||
		categoryId === TEMPLATE_PART_ALL_AREAS_CATEGORY ||
		( categoryId === PATTERN_USER_CATEGORY &&
			item.type === PATTERN_TYPES.user ) ||
		hasCategory( item, categoryId );

	return searchAndRankItems( items, searchInput, {
		fields: PATTERN_FIELDS,
		filter,
	} );
};
