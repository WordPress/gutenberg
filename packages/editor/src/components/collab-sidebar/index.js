/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, subscribe } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import PluginSidebar from '../plugin-sidebar';
import { collabHistorySidebarName, collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';
import AddCommentButton from './comment-button';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import { useBlockComments } from './hooks';

/**
 * External dependencies
 */
import clsx from 'clsx';
import {
	useFloating,
	offset as offsetMiddleware,
	autoUpdate,
} from '@floating-ui/react-dom';
const { useBlockElementRef } = unlock( blockEditorPrivateApis );

function CollabSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
	commentSidebarRef,
} ) {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { currentPostId, getSelectedBlockClientId, getBlockAttributes } =
		useSelect( ( select ) => {
			const { getCurrentPostId } = select( editorStore );
			return {
				getSelectedBlockClientId:
					select( blockEditorStore ).getSelectedBlockClientId,
				getBlockAttributes:
					select( blockEditorStore ).getBlockAttributes,
				currentPostId: getCurrentPostId(),
			};
		}, [] );

	const onError = ( error ) => {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? decodeEntities( error.message )
				: __( 'An error occurred while performing an update.' );
		createNotice( 'error', errorMessage, {
			type: 'snackbar',
			isDismissible: true,
		} );
	};

	const addNewComment = async ( { content, parent } ) => {
		try {
			const savedRecord = await saveEntityRecord(
				'root',
				'comment',
				{
					post: currentPostId,
					content,
					comment_type: 'block_comment',
					comment_approved: 0,
					parent: parent || 0,
				},
				{ throwOnError: true }
			);

			// If it's a main comment, update the block attributes with the comment id.
			if ( ! parent && savedRecord?.id ) {
				const metadata = getBlockAttributes(
					getSelectedBlockClientId()
				)?.metadata;
				updateBlockAttributes( getSelectedBlockClientId(), {
					metadata: {
						...metadata,
						commentId: savedRecord.id,
					},
				} );
			}

			createNotice(
				'snackbar',
				parent
					? __( 'Reply added successfully.' )
					: __( 'Comment added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} catch ( error ) {
			onError( error );
		}
	};

	const onEditComment = async ( { id, content, status } ) => {
		const messageType = status ? status : 'updated';
		const messages = {
			approved: __( 'Comment marked as resolved.' ),
			hold: __( 'Comment reopened.' ),
			updated: __( 'Comment updated.' ),
		};

		try {
			await saveEntityRecord(
				'root',
				'comment',
				{
					id,
					content,
					status,
				},
				{ throwOnError: true }
			);
			createNotice(
				'snackbar',
				messages[ messageType ] ?? __( 'Comment updated.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} catch ( error ) {
			onError( error );
		}
	};

	const onCommentDelete = async ( comment ) => {
		try {
			await deleteEntityRecord(
				'root',
				'comment',
				comment.id,
				undefined,
				{
					throwOnError: true,
				}
			);

			if ( ! comment.parent ) {
				const metadata = getBlockAttributes(
					getSelectedBlockClientId()
				)?.metadata;
				updateBlockAttributes( getSelectedBlockClientId(), {
					metadata: {
						...metadata,
						commentId: undefined,
					},
				} );
			}

			createNotice( 'snackbar', __( 'Comment deleted successfully.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	return (
		<div
			className="editor-collab-sidebar-panel"
			style={ styles }
			ref={ commentSidebarRef }
		>
			<VStack role="list" spacing="3">
				<AddComment
					onSubmit={ addNewComment }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
				/>
				<Comments
					threads={ comments }
					onEditComment={ onEditComment }
					onAddReply={ addNewComment }
					onCommentDelete={ onCommentDelete }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
			</VStack>
		</div>
	);
}

function CommentBoardWrapper( {
	thread,
	showCommentBoard,
	setShowCommentBoard,
	backgroundColor,
	previousThreadId,
	commentSidebarRef,
} ) {
	const blockRef = useRef();
	useBlockElementRef( thread.blockClientId, blockRef );

	const selectedBlockElementRect = blockRef.current?.getBoundingClientRect();

	const initialOffsetTop = selectedBlockElementRect?.top;

	const [ heights, setHeights ] = useState( {} );

	const updateHeight = ( id, newHeight ) => {
		setHeights( ( prev ) => {
			if ( prev[ id ] !== newHeight ) {
				return { ...prev, [ id ]: newHeight };
			}
			return prev;
		} );
	};

	const offsetsRef = useRef( {} );
	const updateOffsets = ( id, offset ) => {
		offsetsRef.current[ id ] = offset;
	};

	const previousOffset = previousThreadId
		? offsetsRef.current[ previousThreadId ]
		: 0;

	const previousBoardHeight = heights[ previousThreadId ]
		? heights[ previousThreadId ]
		: 0;

	// If the previous comment board is overlapping this comment, shift it down.
	const calculateOffset = () => {
		if (
			previousOffset &&
			initialOffsetTop < previousOffset + previousBoardHeight
		) {
			return previousOffset - initialOffsetTop + previousBoardHeight + 20;
		}
		return -16; // Remove top padding of the comment board so first comment visually aligns with block.
	};

	// Use floating-ui to track the block element's position. The crossAxis offset
	// is calculated to avoid overlapping comment boards and will shift the board down.
	const { y, refs } = useFloating( {
		placement: 'right-start',
		middleware: [
			offsetMiddleware( {
				crossAxis: calculateOffset(),
			} ),
		],
		whileElementsMounted: autoUpdate,
	} );

	useEffect( () => {
		if ( blockRef.current ) {
			refs.setReference( blockRef.current );
		}
	}, [ blockRef, refs ] );

	useEffect( () => {
		if ( y !== null && y !== 0 ) {
			updateOffsets( thread.id, y, refs.floating?.current?.clientHeight );
		}
	}, [ y, updateOffsets ] );

	useEffect( () => {
		if ( refs.floating?.current ) {
			const newHeight = refs.floating?.current.scrollHeight;
			updateHeight( thread.id, newHeight );
		}
	}, [ thread.id, updateHeight ] );

	return (
		<VStack
			ref={ refs.setFloating }
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'editor-collab-sidebar-panel__active-thread': false,
			} ) }
			spacing="0"
			style={ { top: y } }
		>
			<CollabSidebarContent
				comments={ [ thread ] }
				commentSidebarRef={ commentSidebarRef }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
				styles={ {
					backgroundColor,
				} }
			/>
		</VStack>
	);
}

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const isLargeViewport = useViewportMatch( 'xlarge' );

	const commentSidebarRef = useRef( null );

	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		return {
			postId: getCurrentPostId(),
		};
	}, [] );

	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();

		return {
			blockCommentId: _clientId
				? getBlockAttributes( _clientId )?.metadata?.commentId
				: null,
		};
	}, [] );

	const openCollabBoard = () => {
		setShowCommentBoard( true );
		enableComplementaryArea( 'core', collabHistorySidebarName );
	};

	const { resultComments, unresolvedSortedThreads, totalPages } =
		useBlockComments( postId );

	const hasMoreComments = totalPages && totalPages > 1;

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

	const AddCommentComponent = blockCommentId
		? CommentAvatarIndicator
		: AddCommentButton;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	// If postId is not a valid number, do not render the comment sidebar.
	if ( ! ( !! postId && typeof postId === 'number' ) ) {
		return null;
	}

	return (
		<>
			<AddCommentComponent
				onClick={ openCollabBoard }
				thread={ currentThread }
				hasMoreComments={ hasMoreComments }
			/>
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				// translators: Comments sidebar title
				title={ __( 'Comments' ) }
				icon={ commentIcon }
				closeLabel={ __( 'Close Comments' ) }
			>
				<CollabSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
			</PluginSidebar>
			{ isLargeViewport && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ collabSidebarName }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<div
						className="editor-collab-sidebar__background"
						style={ {
							backgroundColor,
							height: '100%',
						} }
					>
						{ unresolvedSortedThreads.length > 0 &&
							unresolvedSortedThreads.map( ( thread, index ) => {
								return (
									<CommentBoardWrapper
										key={ thread.id }
										thread={ thread }
										showCommentBoard={ showCommentBoard }
										setShowCommentBoard={
											setShowCommentBoard
										}
										backgroundColor={ backgroundColor }
										previousThreadId={
											unresolvedSortedThreads[ index - 1 ]
												?.id
										}
										commentSidebarRef={ commentSidebarRef }
									/>
								);
							} ) }
					</div>
				</PluginSidebar>
			) }
		</>
	);
}
