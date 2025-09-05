/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useSelect,
	useDispatch,
	resolveSelect,
	subscribe,
} from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { comment as commentIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabHistorySidebarName, collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';
import AddCommentButton from './comment-button';
import AddCommentToolbarButton from './comment-button-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import { getCommentIdsFromBlocks } from './utils';

const modifyBlockCommentAttributes = ( settings ) => {
	if ( ! settings.attributes.blockCommentId ) {
		settings.attributes = {
			...settings.attributes,
			blockCommentId: {
				type: 'number',
			},
		};
	}

	return settings;
};

// Apply the filter to all core blocks
addFilter(
	'blocks.registerBlockType',
	'block-comment/modify-core-block-attributes',
	modifyBlockCommentAttributes
);

function CollabSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
} ) {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getEntityRecord } = resolveSelect( coreStore );

	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		const _postId = getCurrentPostId();

		return {
			postId: _postId,
		};
	}, [] );

	const { getSelectedBlockClientId } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Function to save the comment.
	const addNewComment = async ( comment, parentCommentId ) => {
		const args = {
			post: postId,
			content: comment,
			comment_type: 'block_comment',
			comment_approved: 0,
		};

		// Create a new object, conditionally including the parent property
		const updatedArgs = {
			...args,
			...( parentCommentId ? { parent: parentCommentId } : {} ),
		};

		const savedRecord = await saveEntityRecord(
			'root',
			'comment',
			updatedArgs
		);

		if ( savedRecord ) {
			// If it's a main comment, update the block attributes with the comment id.
			if ( ! parentCommentId ) {
				updateBlockAttributes( getSelectedBlockClientId(), {
					blockCommentId: savedRecord?.id,
				} );
			}

			createNotice(
				'snackbar',
				parentCommentId
					? // translators: Reply added successfully
					  __( 'Reply added successfully.' )
					: // translators: Comment added successfully
					  __( 'Comment added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} else {
			onError();
		}
	};

	const onCommentResolve = async ( commentId ) => {
		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			id: commentId,
			status: 'approved',
		} );

		if ( savedRecord ) {
			// translators: Comment resolved successfully
			createNotice( 'snackbar', __( 'Comment marked as resolved.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} else {
			onError();
		}
	};

	const onEditComment = async ( commentId, comment ) => {
		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			id: commentId,
			content: comment,
		} );

		if ( savedRecord ) {
			createNotice(
				'snackbar',
				// translators: Comment edited successfully
				__( 'Comment edited successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} else {
			onError();
		}
	};

	const onError = () => {
		createNotice(
			'error',
			// translators: Error message when comment submission fails
			__(
				'Something went wrong. Please try publishing the post, or you may have already submitted your comment earlier.'
			),
			{
				isDismissible: true,
			}
		);
	};

	const onCommentDelete = async ( commentId ) => {
		const childComment = await getEntityRecord(
			'root',
			'comment',
			commentId
		);
		await deleteEntityRecord( 'root', 'comment', commentId );

		if ( childComment && ! childComment.parent ) {
			updateBlockAttributes( getSelectedBlockClientId(), {
				blockCommentId: undefined,
			} );
		}

		createNotice(
			'snackbar',
			// translators: Comment deleted successfully
			__( 'Comment deleted successfully.' ),
			{
				type: 'snackbar',
				isDismissible: true,
			}
		);
	};

	return (
		<div className="editor-collab-sidebar-panel" style={ styles }>
			<AddComment
				onSubmit={ addNewComment }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
			/>
			<Comments
				key={ getSelectedBlockClientId() }
				threads={ comments }
				onEditComment={ onEditComment }
				onAddReply={ addNewComment }
				onCommentDelete={ onCommentDelete }
				onCommentResolve={ onCommentResolve }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
			/>
		</div>
	);
}

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );

	const { postId, postType, postStatus, threads } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const _postId = getCurrentPostId();
		const data =
			!! _postId && typeof _postId === 'number'
				? select( coreStore ).getEntityRecords( 'root', 'comment', {
						post: _postId,
						type: 'block_comment',
						status: 'any',
						per_page: 100,
				  } )
				: null;
		return {
			postId: _postId,
			postType: getCurrentPostType(),
			postStatus:
				select( editorStore ).getEditedPostAttribute( 'status' ),
			threads: data,
		};
	}, [] );

	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();

		return {
			blockCommentId: _clientId
				? getBlockAttributes( _clientId )?.blockCommentId
				: null,
		};
	}, [] );

	const openCollabBoard = () => {
		setShowCommentBoard( true );
		enableComplementaryArea( 'core', 'edit-post/collab-sidebar' );
	};

	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );

	// Process comments to build the tree structure
	const { resultComments, sortedThreads } = useMemo( () => {
		// Create a compare to store the references to all objects by id
		const compare = {};
		const result = [];

		const filteredComments = ( threads ?? [] ).filter(
			( comment ) => comment.status !== 'trash'
		);

		// Initialize each object with an empty `reply` array
		filteredComments.forEach( ( item ) => {
			compare[ item.id ] = { ...item, reply: [] };
		} );

		// Iterate over the data to build the tree structure
		filteredComments.forEach( ( item ) => {
			if ( item.parent === 0 ) {
				// If parent is 0, it's a root item, push it to the result array
				result.push( compare[ item.id ] );
			} else if ( compare[ item.parent ] ) {
				// Otherwise, find its parent and push it to the parent's `reply` array
				compare[ item.parent ].reply.push( compare[ item.id ] );
			}
		} );

		if ( 0 === result?.length ) {
			return { resultComments: [], sortedThreads: [] };
		}

		const updatedResult = result.map( ( item ) => ( {
			...item,
			reply: [ ...item.reply ].reverse(),
		} ) );

		const blockCommentIds = getCommentIdsFromBlocks( blocks );

		const threadIdMap = new Map(
			updatedResult.map( ( thread ) => [ thread.id, thread ] )
		);

		const sortedComments = blockCommentIds
			.map( ( id ) => threadIdMap.get( id ) )
			.filter( ( thread ) => thread !== undefined );

		return { resultComments: updatedResult, sortedThreads: sortedComments };
	}, [ threads, blocks ] );

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	if ( 0 < resultComments.length ) {
		const unsubscribe = subscribe( () => {
			const activeSidebar = getActiveComplementaryArea( 'core' );

			if ( ! activeSidebar ) {
				enableComplementaryArea( 'core', collabSidebarName );
				unsubscribe();
			}
		} );
	}

	if ( postStatus === 'publish' ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	const AddCommentComponent = blockCommentId
		? AddCommentToolbarButton
		: AddCommentButton;

	return (
		<>
			<AddCommentComponent onClick={ openCollabBoard } />
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				// translators: Comments sidebar title
				title={ __( 'Comments' ) }
				icon={ commentIcon }
			>
				<CollabSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
				/>
			</PluginSidebar>
			<PluginSidebar
				isPinnable={ false }
				header={ false }
				identifier={ collabSidebarName }
				className="editor-collab-sidebar"
				headerClassName="editor-collab-sidebar__header"
			>
				<CollabSidebarContent
					comments={ sortedThreads }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					styles={ {
						backgroundColor,
					} }
				/>
			</PluginSidebar>
		</>
	);
}
