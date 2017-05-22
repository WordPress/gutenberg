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
	} else if ( password !== undefined && password !== null ) {
		return 'password';
	}
	return 'public';
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

export function getSelectedBlock( state ) {
	if ( ! state.selectedBlock.uid ) {
		return null;
	}
	return state.editor.blocksByUid[ state.selectedBlock.uid ];
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

export function getSuggestedPostFormat( state ) {
	const blocks = state.editor.blockOrder;

	let type;
	if ( blocks.length === 1 ) {
		type = state.editor.blocksByUid[ blocks[ 0 ] ].blockType;
	}

	switch ( type ) {
		case 'core/image':
			return 'Image';
		case 'core/quote':
			return 'Quote';
		default:
			return false;
	}
}
