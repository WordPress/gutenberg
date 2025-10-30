/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import {
	collabHistorySidebarName,
	collabSidebarName,
	SIDEBARS,
} from './constants';
import { Comments } from './comments';
import { store as editorStore } from '../../store';
import AddCommentMenuItem from './comment-menu-item';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import {
	useBlockComments,
	useBlockCommentsActions,
	useEnableFloatingSidebar,
} from './hooks';
import { focusCommentThread } from './utils';
import PostTypeSupportCheck from '../post-type-support-check';

function NotesSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
	commentSidebarRef,
	reflowComments,
	commentLastUpdated,
	isFloating = false,
} ) {
	const { onCreate, onEdit, onDelete } =
		useBlockCommentsActions( reflowComments );

	return (
		<VStack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="list"
			spacing="3"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					commentSidebarRef.current = node;
				}
			} }
		>
			<Comments
				threads={ comments }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
				commentSidebarRef={ commentSidebarRef }
				reflowComments={ reflowComments }
				commentLastUpdated={ commentLastUpdated }
				isFloating={ isFloating }
			/>
		</VStack>
	);
}

// Wrapper component to prevent performance hit when there are no notes for the post
// Once there are notes, the sidebar component will run as before.
function NotesSetup( { postId, mode } ) {
	// Check if there are any comments for the post
	const queryArgs = {
		post: postId,
		type: 'note',
		status: 'all',
		per_page: 1,
	};

	const { records: notes } = useEntityRecords( 'root', 'comment', queryArgs, {
		enabled: !! postId && typeof postId === 'number',
	} );

	const hasNotes = notes && notes.length > 0;
	const [ shouldForceShow, setShouldForceShow ] = useState( false );

	const forceOpenTheSidebar = () => {
		setShouldForceShow( true );
	};

	// If there are no notes, we need:
	// - an empty sidebar with a message so we show the notes button in the header.
	// - The Add Comment Menu Item in the toolbar options
	return (
		<>
			{ ! hasNotes && ! shouldForceShow && (
				<>
					<AddCommentMenuItem onClick={ forceOpenTheSidebar } />
					<PluginSidebar
						identifier={ collabHistorySidebarName }
						name={ collabHistorySidebarName }
						title={ __( 'Notes' ) }
						icon={ commentIcon }
						closeLabel={ __( 'Close Notes' ) }
					>
						<VStack
							className="editor-collab-sidebar-panel"
							role="list"
							spacing="3"
							justify="flex-start"
						>
							<Text as="p">{ __( 'No notes available.' ) }</Text>
							<Text as="p" variant="muted">
								{ __( 'Only logged in users can see Notes.' ) }
							</Text>
						</VStack>
					</PluginSidebar>
				</>
			) }
			{ ( hasNotes || shouldForceShow ) && (
				<NotesSidebar
					postId={ postId }
					mode={ mode }
					forceShowOnMount={ shouldForceShow }
				/>
			) }
		</>
	);
}

function NotesSidebar( { postId, mode, forceShowOnMount = false } ) {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const showFloatingSidebar = isLargeViewport && mode === 'post-only';

	const blockCommentId = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return clientId
			? getBlockAttributes( clientId )?.metadata?.noteId
			: null;
	}, [] );

	const {
		resultComments,
		unresolvedSortedThreads,
		reflowComments,
		commentLastUpdated,
	} = useBlockComments( postId );
	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( unresolvedSortedThreads.length > 0 || showCommentBoard )
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	async function openTheSidebar() {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );

		if ( currentThread?.status === 'approved' ) {
			enableComplementaryArea( 'core', collabHistorySidebarName );
		} else if ( ! activeNotesArea ) {
			enableComplementaryArea(
				'core',
				showFloatingSidebar
					? collabSidebarName
					: collabHistorySidebarName
			);
		}

		const currentArea = await getActiveComplementaryArea( 'core' );
		// Bail out if the current active area is not one of note sidebars.
		if ( ! SIDEBARS.includes( currentArea ) ) {
			return;
		}

		setShowCommentBoard( ! blockCommentId );
		focusCommentThread(
			blockCommentId,
			commentSidebarRef.current,
			// Focus a comment thread when there's a selected block with a comment.
			! blockCommentId ? 'textarea' : undefined
		);
	}

	// This should only run on mount
	useEffect( () => {
		if ( forceShowOnMount ) {
			openTheSidebar();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			{ blockCommentId && (
				<CommentAvatarIndicator
					thread={ currentThread }
					onClick={ openTheSidebar }
				/>
			) }
			<AddCommentMenuItem onClick={ openTheSidebar } />
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				name={ collabHistorySidebarName }
				title={ __( 'Notes' ) }
				icon={ commentIcon }
				closeLabel={ __( 'Close Notes' ) }
			>
				<NotesSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
					reflowComments={ reflowComments }
					commentLastUpdated={ commentLastUpdated }
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
					<NotesSidebarContent
						comments={ unresolvedSortedThreads }
						showCommentBoard={ showCommentBoard }
						setShowCommentBoard={ setShowCommentBoard }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						styles={ {
							backgroundColor,
						} }
						isFloating
					/>
				</PluginSidebar>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, mode } = useSelect( ( select ) => {
		const { getCurrentPostId, getRenderingMode } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			mode: getRenderingMode(),
		};
	}, [] );

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<NotesSetup postId={ postId } mode={ mode } />
		</PostTypeSupportCheck>
	);
}
