import { __ } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';
import {
	BlockIcon,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const { searchItems, normalizeString } = unlock( blockEditorPrivateApis );

/**
 * The `type` of a suggestion that inserts a block rather than setting a link.
 */
export const BLOCK_SUGGESTION_TYPE = 'block';

/**
 * How many blocks to list at most, so they do not crowd out the links.
 */
export const MAX_BLOCK_SUGGESTIONS = 3;

/**
 * The link variations are left out: searching already finds the pages, posts
 * and terms they would link to.
 */
const EXCLUDED_BLOCK_NAMES = [ 'core/navigation-link' ];

// Match on what a block is called, not on its description or category, which
// would list blocks for words that only happen to describe them.
const SEARCH_FIELDS = [
	{ get: ( item ) => item.title },
	{ get: ( item ) => item.keywords },
];

/**
 * Adds the blocks that match a search to the link suggestions.
 *
 * A block whose title starts with the search is what was asked for by name,
 * so it goes before the links. Any other matching block goes after them.
 *
 * @param {Array}  suggestions Link suggestions.
 * @param {Array}  blockItems  Inserter items the Navigation allows.
 * @param {string} searchTerm  What the user typed.
 * @return {Array} The suggestions, with any matching blocks added.
 */
export function addBlockSuggestions( suggestions, blockItems, searchTerm ) {
	if ( ! searchTerm?.trim() ) {
		return suggestions;
	}

	const matches = searchItems( blockItems, searchTerm, {
		fields: SEARCH_FIELDS,
		filter: ( item ) =>
			! item.isDisabled && ! EXCLUDED_BLOCK_NAMES.includes( item.name ),
	} ).slice( 0, MAX_BLOCK_SUGGESTIONS );

	if ( ! matches.length ) {
		return suggestions;
	}

	const search = normalizeString( searchTerm.trim() );
	const before = [];
	const after = [];

	for ( const item of matches ) {
		const suggestion = {
			id: item.id,
			type: BLOCK_SUGGESTION_TYPE,
			title: item.title,
			icon: createElement( BlockIcon, { icon: item.icon } ),
			typeLabel: __( 'Block' ),
		};

		if ( normalizeString( item.title ).startsWith( search ) ) {
			before.push( suggestion );
		} else {
			after.push( suggestion );
		}
	}

	return [ ...before, ...suggestions, ...after ];
}
