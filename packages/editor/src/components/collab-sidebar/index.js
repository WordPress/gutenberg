/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, subscribe } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import PluginSidebar from '../plugin-sidebar';
import { collabHistorySidebarName, collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';
import AddCommentMenuItem from './comment-menu-item';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import { useBlockComments, useBlockCommentsActions } from './hooks';

/**
 * External dependencies
 */
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
	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<div
			className="editor-collab-sidebar-panel"
			style={ styles }
			ref={ commentSidebarRef }
		>
			<VStack role="list" spacing="3">
				<AddComment
					onSubmit={ onCreate }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
				<Comments
					threads={ comments }
					onEditComment={ onEdit }
					onAddReply={ onCreate }
					onCommentDelete={ onDelete }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
			</VStack>
		</div>
	);
}

function FloatingCommentBoard( {
	thread,
	showCommentBoard,
	setShowCommentBoard,
	previousThreadId,
	commentSidebarRef,
	offsetsRef,
	updateOffsets,
	updateHeight,
	heights,
} ) {
	const blockRef = useRef();
	useBlockElementRef( thread.blockClientId, blockRef );

	const selectedBlockElementRect = blockRef.current?.getBoundingClientRect();

	const initialOffsetTop = selectedBlockElementRect?.top;

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
	}, [ y, refs.floating, thread.id ] );

	useEffect( () => {
		if ( refs.floating?.current ) {
			const newHeight = refs.floating?.current.scrollHeight;
			updateHeight( thread.id, newHeight );
		}
	}, [ thread.id, updateHeight ] );
	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<VStack
			ref={ refs.setFloating }
			className="editor-collab-sidebar-panel__thread is-floating"
			spacing="0"
			style={ { top: y } }
		>
			<Comments
				threads={ [ thread ] }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
				commentSidebarRef={ commentSidebarRef }
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

	const [ heights, setHeights ] = useState( {} );

	const updateHeight = ( id, newHeight ) => {
		setHeights( ( prev ) => {
			if ( prev[ id ] !== newHeight ) {
				return { ...prev, [ id ]: newHeight };
			}
			return prev;
		} );
	};

	const { selectBlock } = useDispatch( blockEditorStore );
	const handleThreadClick = ( thread ) => {
		if ( thread?.clientId ) {
			selectBlock( thread.clientId );
		}
	};

	const offsetsRef = useRef( {} );
	const updateOffsets = ( id, offset ) => {
		offsetsRef.current[ id ] = offset;
	};
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
			{ blockCommentId && (
				<CommentAvatarIndicator
					thread={ currentThread }
					hasMoreComments={ hasMoreComments }
				/>
			) }
			<AddCommentMenuItem onClick={ openCollabBoard } />
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
						className="editor-collab-sidebar-panel"
						style={ {
							backgroundColor,
						} }
						ref={ commentSidebarRef }
					>
						{ unresolvedSortedThreads.length > 0 &&
							unresolvedSortedThreads.map( ( thread, index ) => {
								return (
									<FloatingCommentBoard
										key={ thread.id }
										thread={ thread }
										showCommentBoard={ showCommentBoard }
										setShowCommentBoard={
											setShowCommentBoard
										}
										offsetsRef={ offsetsRef }
										updateOffsets={ updateOffsets }
										updateHeight={ updateHeight }
										heights={ heights }
										previousThreadId={
											unresolvedSortedThreads[ index - 1 ]
												?.id
										}
										onClick={ () =>
											handleThreadClick( thread )
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
