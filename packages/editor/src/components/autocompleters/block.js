/**
 * External dependencies
 */
import { once } from 'lodash';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { BlockIcon } from '@wordpress/block-editor';

/** @typedef {import('@wordpress/block-editor').WPEditorInserterItem} WPEditorInserterItem */

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

/**
 * Returns the client ID of the parent where a newly inserted block would be
 * placed.
 *
 * @return {string} Client ID of the parent where a newly inserted block would
 *                  be placed.
 */
function defaultGetBlockInsertionParentClientId() {
	return select( 'core/block-editor' ).getBlockInsertionPoint().rootClientId;
}

/**
 * Returns the inserter items for the specified parent block.
 *
 * @param {string} rootClientId Client ID of the block for which to retrieve
 *                              inserter items.
 *
 * @return {Array<WPEditorInserterItem>} The inserter items for the specified
 *                                      parent.
 */
function defaultGetInserterItems( rootClientId ) {
	return select( 'core/block-editor' ).getInserterItems( rootClientId );
}

/**
 * Returns the name of the currently selected block.
 *
 * @return {string?} The name of the currently selected block or `null` if no
 *                   block is selected.
 */
function defaultGetSelectedBlockName() {
	const { getSelectedBlockClientId, getBlockName } = select(
		'core/block-editor'
	);
	const selectedBlockClientId = getSelectedBlockClientId();
	return selectedBlockClientId ? getBlockName( selectedBlockClientId ) : null;
}

/**
 * Triggers a fetch of reusable blocks, once.
 *
 * TODO: Reusable blocks fetching should be reimplemented as a core-data entity
 * resolver, not relying on `core/editor` (see #7119). The implementation here
 * is imperfect in that the options result will not await the completion of the
 * fetch request and thus will not include any reusable blocks. This has always
 * been true, but relied upon the fact the user would be delayed in typing an
 * autocompleter search query. Once implemented using resolvers, the status of
 * this request could be subscribed to as part of a promised return value using
 * the result of `hasFinishedResolution`. There is currently reliable way to
 * determine that a reusable blocks fetch request has completed.
 *
 * @return {Promise} Promise resolving once reusable blocks fetched.
 */
const fetchReusableBlocks = once( () => {
	dispatch( 'core/editor' ).__experimentalFetchReusableBlocks();
} );

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {WPCompleter} A blocks completer.
 */
export function createBlockCompleter( {
	// Allow store-based selectors to be overridden for unit test.
	getBlockInsertionParentClientId = defaultGetBlockInsertionParentClientId,
	getInserterItems = defaultGetInserterItems,
	getSelectedBlockName = defaultGetSelectedBlockName,
} = {} ) {
	return {
		name: 'blocks',
		className: 'editor-autocompleters__block',
		triggerPrefix: '/',
		options() {
			fetchReusableBlocks();

			const selectedBlockName = getSelectedBlockName();
			return getInserterItems( getBlockInsertionParentClientId() ).filter(
				// Avoid offering to replace the current block with a block of the same type.
				( inserterItem ) => selectedBlockName !== inserterItem.name
			);
		},
		getOptionKeywords( inserterItem ) {
			const { title, keywords = [], category } = inserterItem;
			return [ category, ...keywords, title ];
		},
		getOptionLabel( inserterItem ) {
			const { icon, title } = inserterItem;
			return [ <BlockIcon key="icon" icon={ icon } showColors />, title ];
		},
		allowContext( before, after ) {
			return ! ( /\S/.test( before ) || /\S/.test( after ) );
		},
		getOptionCompletion( inserterItem ) {
			const { name, initialAttributes } = inserterItem;
			return {
				action: 'replace',
				value: createBlock( name, initialAttributes ),
			};
		},
		isOptionDisabled( inserterItem ) {
			return inserterItem.isDisabled;
		},
	};
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {WPCompleter} A blocks completer.
 */
export default createBlockCompleter();
