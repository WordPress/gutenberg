/**
 * External dependencies
 */
import { get, last } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	parse,
	getBlockType,
	switchToBlockType,
	createBlock,
	getDefaultBlockForPostFormat,
	doBlocksMatchTemplate,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import {
	setupEditorState,
	replaceBlocks,
	createWarningNotice,
	insertBlock,
	selectBlock,
	resetBlocks,
	setTemplateValidity,
} from './actions';
import {
	getBlock,
	getBlockCount,
	getBlockRootClientId,
	getBlocks,
	getPreviousBlockClientId,
	getSelectedBlock,
	getTemplate,
	getTemplateLock,
} from './selectors';
import {
	fetchReusableBlocks,
	saveReusableBlocks,
	deleteReusableBlocks,
	convertBlockToReusable,
	convertBlockToStatic,
	receiveReusableBlocks,
} from './effects/reusable-blocks';
import {
	requestPostUpdate,
	requestPostUpdateSuccess,
	requestPostUpdateFailure,
	trashPost,
	trashPostFailure,
	refreshPost,
	AUTOSAVE_POST_NOTICE_ID,
} from './effects/posts';

export default {
	REQUEST_POST_UPDATE: ( action, store ) => {
		requestPostUpdate( action, store );
	},
	REQUEST_POST_UPDATE_SUCCESS: requestPostUpdateSuccess,
	REQUEST_POST_UPDATE_FAILURE: requestPostUpdateFailure,
	TRASH_POST: ( action, store ) => {
		trashPost( action, store );
	},
	TRASH_POST_FAILURE: trashPostFailure,
	REFRESH_POST: ( action, store ) => {
		refreshPost( action, store );
	},
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const state = store.getState();
		const [ firstBlockClientId, secondBlockClientId ] = action.blocks;
		const blockA = getBlock( state, firstBlockClientId );
		const blockB = getBlock( state, secondBlockClientId );
		const blockType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockType.merge ) {
			dispatch( selectBlock( blockA.clientId ) );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType = blockA.name === blockB.name ?
			[ blockB ] :
			switchToBlockType( blockB, blockA.name );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = blockType.merge(
			blockA.attributes,
			blocksWithTheSameType[ 0 ].attributes
		);

		dispatch( selectBlock( blockA.clientId, -1 ) );
		dispatch( replaceBlocks(
			[ blockA.clientId, blockB.clientId ],
			[
				{
					...blockA,
					attributes: {
						...blockA.attributes,
						...updatedAttributes,
					},
				},
				...blocksWithTheSameType.slice( 1 ),
			]
		) );
	},
	SETUP_EDITOR( action, { getState } ) {
		const { post, autosave } = action;
		const state = getState();
		const template = getTemplate( state );
		const templateLock = getTemplateLock( state );

		// Parse content as blocks
		let blocks;
		let isValidTemplate = true;
		if ( post.content.raw ) {
			blocks = parse( post.content.raw );

			// Unlocked templates are considered always valid because they act as default values only.
			isValidTemplate = (
				! template ||
				templateLock !== 'all' ||
				doBlocksMatchTemplate( blocks, template )
			);
		} else if ( template ) {
			blocks = synchronizeBlocksWithTemplate( [], template );
		} else if ( getDefaultBlockForPostFormat( post.format ) ) {
			blocks = [ createBlock( getDefaultBlockForPostFormat( post.format ) ) ];
		} else {
			blocks = [];
		}

		// Include auto draft title in edits while not flagging post as dirty
		const edits = {};
		if ( post.status === 'auto-draft' ) {
			edits.title = post.title.raw;
		}

		// Check the auto-save status
		let autosaveAction;
		if ( autosave ) {
			const noticeMessage = __( 'There is an autosave of this post that is more recent than the version below.' );
			autosaveAction = createWarningNotice(
				<p>
					{ noticeMessage }
					{ ' ' }
					<a href={ autosave.editLink }>{ __( 'View the autosave' ) }</a>
				</p>,
				{
					id: AUTOSAVE_POST_NOTICE_ID,
					spokenMessage: noticeMessage,
				}
			);
		}

		return [
			setTemplateValidity( isValidTemplate ),
			setupEditorState( post, blocks, edits ),
			...( autosaveAction ? [ autosaveAction ] : [] ),
		];
	},
	SYNCHRONIZE_TEMPLATE( action, { getState } ) {
		const state = getState();
		const blocks = getBlocks( state );
		const template = getTemplate( state );
		const updatedBlockList = synchronizeBlocksWithTemplate( blocks, template );

		return [
			resetBlocks( updatedBlockList ),
			setTemplateValidity( true ),
		];
	},
	CHECK_TEMPLATE_VALIDITY( action, { getState } ) {
		const state = getState();
		const blocks = getBlocks( state );
		const template = getTemplate( state );
		const templateLock = getTemplateLock( state );
		const isValid = (
			! template ||
			templateLock !== 'all' ||
			doBlocksMatchTemplate( blocks, template )
		);

		return setTemplateValidity( isValid );
	},
	FETCH_REUSABLE_BLOCKS: ( action, store ) => {
		fetchReusableBlocks( action, store );
	},
	SAVE_REUSABLE_BLOCK: ( action, store ) => {
		saveReusableBlocks( action, store );
	},
	DELETE_REUSABLE_BLOCK: ( action, store ) => {
		deleteReusableBlocks( action, store );
	},
	RECEIVE_REUSABLE_BLOCKS: receiveReusableBlocks,
	CONVERT_BLOCK_TO_STATIC: convertBlockToStatic,
	CONVERT_BLOCK_TO_REUSABLE: convertBlockToReusable,
	CREATE_NOTICE( { notice: { content, spokenMessage } } ) {
		const message = spokenMessage || content;
		speak( message, 'assertive' );
	},

	EDIT_POST( action, { getState } ) {
		const format = get( action, [ 'edits', 'format' ] );
		if ( ! format ) {
			return;
		}
		const blockName = getDefaultBlockForPostFormat( format );
		if ( blockName && getBlockCount( getState() ) === 0 ) {
			return insertBlock( createBlock( blockName ) );
		}
	},

	REMOVE_BLOCKS( action, { getState, dispatch } ) {
		// if the action says previous block should not be selected don't do anything.
		if ( ! action.selectPrevious ) {
			return;
		}

		const firstRemovedBlockClientId = action.clientIds[ 0 ];
		const state = getState();
		const currentSelectedBlock = getSelectedBlock( state );

		// recreate the state before the block was removed.
		const previousState = { ...state, editor: { present: last( state.editor.past ) } };

		// rootClientId of the removed block.
		const rootClientId = getBlockRootClientId( previousState, firstRemovedBlockClientId );

		// Client ID of the block that was before the removed block or the
		// rootClientId if the removed block was first amongst its siblings.
		const blockClientIdToSelect = getPreviousBlockClientId( previousState, firstRemovedBlockClientId ) || rootClientId;

		// Dispatch select block action if the currently selected block
		// is not already the block we want to be selected.
		if ( blockClientIdToSelect !== currentSelectedBlock ) {
			dispatch( selectBlock( blockClientIdToSelect ) );
		}
	},
};
