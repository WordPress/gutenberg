/**
 * External dependencies
 */
import { first, last, get } from 'lodash';

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

export function isEditedPostNew( state ) {
	return ! state.currentPost.id;
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

export function getEditedPostAttribute( state, attributeName ) {
	return state.editor.edits[ attributeName ] === undefined
		? state.currentPost[ attributeName ]
		: state.editor.edits[ attributeName ];
}

export function getEditedPostStatus( state ) {
	return getEditedPostAttribute( state, 'status' );
}

export function getEditedPostVisibility( state ) {
	const status = getEditedPostStatus( state );
	const password = getEditedPostAttribute( state, 'password' );

	if ( status === 'private' ) {
		return 'private';
	} else if ( password ) {
		return 'password';
	}
	return 'public';
}

export function getEditedPostTitle( state ) {
	return state.editor.edits.title === undefined
		? get( state.currentPost, 'title.raw' )
		: state.editor.edits.title;
}

export function getEditedPostExcerpt( state ) {
	return state.editor.edits.excerpt === undefined
		? get( state.currentPost, 'excerpt.raw' )
		: state.editor.edits.excerpt;
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

export function getSelectedBlock( state ) {
	const { uid } = state.selectedBlock;
	const { start, end } = state.multiSelectedBlocks;

	if ( start || end || ! uid ) {
		return null;
	}

	return state.editor.blocksByUid[ uid ];
}

export function getSelectedBlocks( state ) {
	const { blockOrder } = state.editor;
	const { start, end } = state.multiSelectedBlocks;

	if ( ! start || ! end ) {
		return [];
	}

	const startIndex = blockOrder.indexOf( start );
	const endIndex = blockOrder.indexOf( end );

	if ( startIndex > endIndex ) {
		return blockOrder.slice( endIndex, startIndex + 1 );
	}

	return blockOrder.slice( startIndex, endIndex + 1 );
}

export function getBlockSelectionStart( state ) {
	return state.multiSelectedBlocks.start;
}

export function getBlockSelectionEnd( state ) {
	return state.multiSelectedBlocks.end;
}

export function getBlockUids( state ) {
	return state.editor.blockOrder;
}

export function getBlockOrder( state, uid ) {
	return state.editor.blockOrder.indexOf( uid );
}

export function isFirstBlock( state, uid ) {
	return first( state.editor.blockOrder ) === uid;
}

export function isFirstSelectedBlock( state, uid ) {
	return first( getSelectedBlocks( state ) ) === uid;
}

export function isLastBlock( state, uid ) {
	return last( state.editor.blockOrder ) === uid;
}

export function getPreviousBlock( state, uid ) {
	const order = getBlockOrder( state, uid );
	return state.editor.blocksByUid[ state.editor.blockOrder[ order - 1 ] ] || null;
}

export function getNextBlock( state, uid ) {
	const order = getBlockOrder( state, uid );
	return state.editor.blocksByUid[ state.editor.blockOrder[ order + 1 ] ] || null;
}

export function isBlockSelected( state, uid ) {
	const { start, end } = state.multiSelectedBlocks;

	if ( start || end ) {
		return null;
	}

	return state.selectedBlock.uid === uid;
}

export function isBlockMultiSelected( state, uid ) {
	return getSelectedBlocks( state ).indexOf( uid ) !== -1;
}

export function isBlockHovered( state, uid ) {
	return state.hoveredBlock === uid;
}

export function getBlockFocus( state, uid ) {
	if ( ! isBlockSelected( state, uid ) ) {
		return null;
	}

	return state.selectedBlock.focus;
}

export function isTypingInBlock( state, uid ) {
	if ( ! isBlockSelected( state, uid ) ) {
		return false;
	}

	return state.selectedBlock.typing;
}

export function getBlockInsertionPoint( state ) {
	if ( ! state.insertionPoint.show ) {
		return null;
	}
	const blockToInsertAfter = state.insertionPoint.uid;

	return blockToInsertAfter || last( state.editor.blockOrder );
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

export function getSuggestedPostFormat( state ) {
	const blocks = state.editor.blockOrder;

	let type;
	// If there is only one block in the content of the post grab its
	// `blockType` name so we can derive a suitable post format from it.
	if ( blocks.length === 1 ) {
		type = state.editor.blocksByUid[ blocks[ 0 ] ].blockType;
	}

	// We only convert to default post formats in core.
	switch ( type ) {
		case 'core/image':
			return 'Image';
		case 'core/quote':
			return 'Quote';
		default:
			return false;
	}
}
