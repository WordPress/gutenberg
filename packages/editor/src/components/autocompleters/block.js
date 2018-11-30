/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

/**
 * Returns the client ID of the parent where a newly inserted block would be
 * placed.
 *
 * @return {string} Client ID of the parent where a newly inserted block would
 *                  be placed.
 */
function defaultGetBlockInsertionParentClientId() {
	return select( 'core/editor' ).getBlockInsertionPoint().rootClientId;
}

/**
 * Returns the inserter items for the specified parent block.
 *
 * @param {string} rootClientId Client ID of the block for which to retrieve
 *                              inserter items.
 *
 * @return {Array<Editor.InserterItem>} The inserter items for the specified
 *                                      parent.
 */
function defaultGetInserterItems( rootClientId ) {
	return select( 'core/editor' ).getInserterItems( rootClientId );
}

/**
 * Returns the name of the currently selected block.
 *
 * @return {string?} The name of the currently selected block or `null` if no
 *                   block is selected.
 */
function defaultGetSelectedBlockName() {
	const { getSelectedBlockClientId, getBlockName } = select( 'core/editor' );
	const selectedBlockClientId = getSelectedBlockClientId();
	return selectedBlockClientId ? getBlockName( selectedBlockClientId ) : null;
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Completer} A blocks completer.
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
			return [
				<BlockIcon key="icon" icon={ icon } showColors />,
				title,
			];
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
 * @return {Completer} A blocks completer.
 */
export default createBlockCompleter();
