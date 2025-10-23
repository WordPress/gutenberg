/**
 * WordPress dependencies
 */
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Determines which block tools should be showing based on the current editor state.
 * This is a pure function that can be called from within a selector.
 *
 * @param {Object}  options                        Calculation options.
 * @param {Object}  options.block                  The selected block object.
 * @param {string}  options.blockMode              The block mode ('visual' or 'html').
 * @param {boolean} options.isBlockInterfaceHidden Whether the block interface is hidden.
 * @param {string}  options.clientId               The selected block client ID.
 * @param {boolean} options.isTyping               Whether the user is currently typing.
 * @param {boolean} options.hasFixedToolbar        Whether the toolbar is fixed.
 *
 * @return {Object} Object of which block tools will be shown.
 */
export function shouldShowBlockTools( {
	block,
	blockMode,
	isBlockInterfaceHidden,
	clientId,
	isTyping,
	hasFixedToolbar,
} ) {
	const hasSelectedBlock = !! clientId && !! block;
	const isEmptyDefaultBlock =
		hasSelectedBlock &&
		isUnmodifiedDefaultBlock( block, 'content' ) &&
		blockMode !== 'html';
	const showEmptyBlockSideInserter =
		clientId && ! isTyping && isEmptyDefaultBlock;
	const showBlockToolbarPopover =
		! isBlockInterfaceHidden &&
		! hasFixedToolbar &&
		! showEmptyBlockSideInserter &&
		hasSelectedBlock &&
		! isEmptyDefaultBlock;

	return {
		showEmptyBlockSideInserter,
		showBlockToolbarPopover,
	};
}
