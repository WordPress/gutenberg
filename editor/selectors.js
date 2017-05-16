/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * Internal dependencies
 */
import { addQueryArgs } from './utils/url';

export function getEditorMode( state ) {
	return state.mode;
}

export function isEditorSidebarOpened( state ) {
	return state.isSidebarOpened;
}

export function hasEditorUndo( state ) {
	return state.editor.history.past.length > 0;
}

export function hasEditorRedo( state ) {
	return state.editor.history.future.length > 0;
}

export function isEditedPostDirty( state ) {
	return state.editor.dirty;
}

export function getCurrentPost( state ) {
	return state.currentPost;
}

export function getPostEdits( state ) {
	return state.editor.edits;
}

export function getEditedPostTitle( state ) {
	return state.editor.edits.title === undefined
		? state.currentPost.title.raw
		: state.editor.edits.title;
}

export function getEditedPostPreviewLink( state ) {
	const link = state.currentPost.link;
	if ( ! link ) {
		return null;
	}

	return addQueryArgs( link, { preview: 'true' } );
}

export function getBlock( state, uid ) {
	return state.editor.blocksByUid[ uid ];
}

export function getBlocks( state ) {
	return state.editor.blockOrder.map( ( uid ) => (
		state.editor.blocksByUid[ uid ]
	) );
}

export function getBlockUids( state ) {
	return state.editor.blockOrder;
}

export function getBlockOrder( state, uid ) {
	return state.editor.blockOrder.indexOf( uid );
}

/**
 * Returns true if the block is empty, null if the block is not known, or null
 * otherwise.
 *
 * @param  {Object}   state Current application state
 * @param  {string}   uid   Block UID
 * @return {?Boolean}       Whether block is empty, or null if unknown
 */
export function isNewBlock( state, uid ) {
	const block = getBlock( state, uid );
	if ( ! block ) {
		return null;
	}

	// A block is considered new if it's a text block without content. Usually
	// we'd avoid engrained knowledge of specific block types, but the behavior
	// of text as the default new inserted block is a special case. Regardless,
	// that we abstract this behind a generic selector enables us to refactor
	// in the future to one with fewer specific implementation details.

	return (
		'core/text' === block.blockType &&
		! block.attributes.content
	);
}

export function isFirstBlock( state, uid ) {
	return first( state.editor.blockOrder ) === uid;
}

export function isLastBlock( state, uid ) {
	return last( state.editor.blockOrder ) === uid;
}

export function getPreviousBlock( state, uid ) {
	const order = getBlockOrder( state, uid );
	return state.editor.blocksByUid[ state.editor.blockOrder[ order - 1 ] ] || null;
}

export function isBlockSelected( state, uid ) {
	return state.selectedBlock.uid === uid;
}

export function isBlockHovered( state, uid ) {
	return state.hoveredBlock === uid;
}

export function getBlockFocus( state, uid ) {
	return state.selectedBlock.uid === uid ? state.selectedBlock.focus : null;
}

export function isTypingInBlock( state, uid ) {
	return state.selectedBlock.uid === uid ? state.selectedBlock.typing : false;
}

export function isSavingPost( state ) {
	return state.saving.requesting;
}

export function didPostSaveRequestSucceed( state ) {
	return state.saving.successful;
}

export function didPostSaveRequestFail( state ) {
	return !! state.saving.error;
}

export function isSavingNewPost( state ) {
	return state.saving.isNew;
}
