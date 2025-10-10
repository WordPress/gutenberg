/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
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
import {
	useBlockComments,
	useBlockCommentsActions,
	useEnableFloatingSidebar,
} from './hooks';

/**
 * External dependencies
 */
import {
	useFloating,
	offset as offsetMiddleware,
	autoUpdate,
} from '@floating-ui/react-dom';
import { set } from 'date-fns';
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
	commentSidebarRef,
	calculatedOffset,
	updateHeight,
	onPositionCalculated,
	setCommentAndBlockRef,
	selectedThreadId,
	handleThreadClick,
} ) {
	const blockRef = useRef();
	useBlockElementRef( thread.blockClientId, blockRef );

	// Use floating-ui to track the block element's position with the calculated offset.
	const { y, refs } = useFloating( {
		placement: 'right-start',
		middleware: [
			offsetMiddleware( {
				crossAxis: calculatedOffset || -16,
			} ),
		],
		whileElementsMounted: autoUpdate,
	} );

	useEffect( () => {
		if ( blockRef.current ) {
			refs.setReference( blockRef.current );
		}
	}, [ blockRef, refs ] );

	// Track height changes.
	useEffect( () => {
		if ( refs.floating?.current ) {
			setCommentAndBlockRef( thread.id, refs.floating.current, blockRef.current );
		}
	}, [ thread.id, refs.floating ] );

	// When a thread is expanded or collapsed, recalculate its height after a short delay.
	useEffect( () => {
		if ( refs.floating?.current ) {
			setTimeout( () => {
				const newHeight = refs.floating.current.scrollHeight;
				updateHeight( thread.id, newHeight );
			}, 1000 );
		}
	}, [ showCommentBoard, thread.id, updateHeight, refs.floating, selectedThreadId ] );

	// Report the calculated absolute position back to parent
	useEffect( () => {
		if ( y !== null && y !== 0 ) {
			onPositionCalculated( thread.id, y );
		}
	}, [ y, thread.id, onPositionCalculated, calculatedOffset ] );

	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<VStack
			ref={ refs.setFloating }
			className="editor-collab-sidebar-panel__thread is-floating"
			spacing="0"
			onClick={ () => handleThreadClick( thread ) }
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
	const isLargeViewport = useViewportMatch( 'medium' );

	const [ heights, setHeights ] = useState( {} );
	const [ boardOffsets, setBoardOffsets ] = useState( {} );
	const [ commentRefs, setCommentRefs ] = useState( {} );
	const [ blockRefs, setBlockRefs ] = useState( {} );
	const [ selectedThreadId, setSelectedThreadId ] = useState( null );
	const absolutePositionsRef = useRef( {} );


	const updateHeight = useCallback( ( id, newHeight ) => {
		console.log( 'update height', id, newHeight );
		setHeights( ( prev ) => {
			if ( prev[ id ] !== newHeight ) {
				return { ...prev, [ id ]: newHeight };
			}
			return prev;
		} );
	}, [] );

	const onPositionCalculated = useCallback( ( id, absoluteY ) => {
		absolutePositionsRef.current[ id ] = absoluteY;
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );
	const handleThreadClick = ( thread ) => {
		console.log( 'handleThreadClick', thread );
		if ( thread?.clientId ) {
			selectBlock( thread.clientId );
		}
		setSelectedThreadId( thread.id );
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
	useEnableFloatingSidebar( resultComments.length > 0 );

	const hasMoreComments = totalPages && totalPages > 1;

	const setCommentAndBlockRef = useCallback( ( id, commentRef, blockRef ) => {
		commentRefs[ id ] = commentRef;
		setCommentRefs( commentRefs );
		blockRefs[ id ] = blockRef;
		setBlockRefs( blockRefs );
	}, [] );


	// Centralized offset calculator that calculates the positions for each thread.
	const calculateAllOffsets = () => {
		const offsets = {};
		let previousThreadData = null;

		console.log( 'heights', { ...heights } );

		unresolvedSortedThreads.forEach( ( thread ) => {

			// Find the top of the thread. This is the normalized top position for the floater.
			const blockElement = blockRefs[ thread.id ];
			const blockRect = blockElement?.getBoundingClientRect();
			const threadTop = blockRect?.top || 0;
			const threadHeight = heights[ thread.id ] || 0;

			let additionalOffset = -16;
			// The first block does not need to move.
			if ( previousThreadData) {
				const previousBottom = previousThreadData.threadTop + previousThreadData.threadHeight;
				if ( threadTop < previousBottom ) {
					// Shift down to avoid overlap.
					additionalOffset = previousBottom - threadTop + 24;
				}
			}

			previousThreadData = {
				threadTop: threadTop + additionalOffset,
				threadHeight,
			};

			offsets[ thread.id ] = additionalOffset;

		} );

		return offsets;
	}

	// Recalculate offsets.
	useEffect( () => {
		//console.log( 'calculateAllOffsets' );
		const newOffsets = calculateAllOffsets();
		console.log( 'new offsets', { ...newOffsets } );
		setBoardOffsets( newOffsets );
	}, [ blockCommentId, heights ] );

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

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
							unresolvedSortedThreads.map( ( thread ) => {
								return (
									<FloatingCommentBoard
										key={ thread.id }
										thread={ thread }
										showCommentBoard={ showCommentBoard }
										setShowCommentBoard={
											setShowCommentBoard
										}
										calculatedOffset={
											boardOffsets[ thread.id ]
										}
										updateHeight={ updateHeight }
										onPositionCalculated={ onPositionCalculated }
										handleThreadClick={ handleThreadClick }
										commentSidebarRef={ commentSidebarRef }
										setCommentAndBlockRef={ setCommentAndBlockRef }
										selectedThreadId={ selectedThreadId }
									/>
								);
							} ) }
					</div>
				</PluginSidebar>
			) }
		</>
	);
}
