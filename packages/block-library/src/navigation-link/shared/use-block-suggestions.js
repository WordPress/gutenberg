import { __ } from '@wordpress/i18n';
import { createElement, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
} from '@wordpress/blocks';
import {
	BlockIcon,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const { searchItems, normalizeString } = unlock( blockEditorPrivateApis );

/**
 * The `type` of a suggestion that inserts a block rather than setting a link.
 */
export const BLOCK_SUGGESTION_TYPE = 'block';

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
	} );

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

/**
 * Lists the blocks a Navigation allows in a link's search results, and
 * inserts the one that is chosen.
 *
 * The allowed blocks are read when a search runs, not subscribed to, so an
 * open link UI does no work as the editor changes.
 *
 * @param {Object}    options               Hook options.
 * @param {string}    options.clientId      Client ID of the link or submenu.
 * @param {boolean}   options.isEnabled     Whether to list blocks at all.
 * @param {Function=} options.onBlockInsert Called with the inserted block by a
 *                                          caller that tracks the new link,
 *                                          such as the list view.
 * @param {Function=} options.onClose       Closes the link UI.
 * @return {{ transformSuggestions: Function|undefined, insertBlockFromSuggestion: Function }}
 * The `transformSuggestions` to give LinkControl, and the handler for a chosen
 * block suggestion.
 */
export function useBlockSuggestions( {
	clientId,
	isEnabled,
	onBlockInsert,
	onClose,
} ) {
	const {
		getBlockIndex,
		getBlockOrder,
		getBlockRootClientId,
		getInserterItems,
	} = useSelect( blockEditorStore );
	const { insertBlock, replaceBlock } = useDispatch( blockEditorStore );

	const transformSuggestions = useCallback(
		( suggestions, { isInitialSuggestions, searchTerm } ) =>
			isInitialSuggestions
				? suggestions
				: addBlockSuggestions(
						suggestions,
						getInserterItems( getBlockRootClientId( clientId ) ),
						searchTerm
					),
		[ clientId, getBlockRootClientId, getInserterItems ]
	);

	const insertBlockFromSuggestion = ( itemId ) => {
		const rootClientId = getBlockRootClientId( clientId );
		const item = getInserterItems( rootClientId ).find(
			( { id } ) => id === itemId
		);

		if ( ! item ) {
			return;
		}

		const block = createBlock(
			item.name,
			item.initialAttributes,
			createBlocksFromInnerBlocksTemplate( item.innerBlocks )
		);
		const index = getBlockIndex( clientId );

		// A caller that tracks the new link, such as the list view, removes it
		// itself once told about the block, as with the "Add block" pane.
		if ( onBlockInsert ) {
			insertBlock( block, index, rootClientId, false );
			onBlockInsert( block );
			return;
		}

		// A submenu keeps its items, so the block goes before it, where the
		// "Add block" pane puts it. An empty link is replaced by the block.
		if ( getBlockOrder( clientId ).length ) {
			insertBlock( block, index, rootClientId );
			onClose?.();
			return;
		}

		replaceBlock( clientId, block );
	};

	return {
		transformSuggestions: isEnabled ? transformSuggestions : undefined,
		insertBlockFromSuggestion,
	};
}
