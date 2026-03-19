/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Modal,
	Button,
	ExternalLink,
	Spinner,
	__experimentalHStack as HStack,
	withFilters,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import {
	useEffect,
	useState,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import { DOCUMENT_SIZE_LIMIT_EXCEEDED } from '../../utils/sync-error-messages';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function CollaborationContext() {
	const { isCollaborationSupported, syncConnectionStatus } = useSelect(
		( select ) => {
			const selectors = unlock( select( coreStore ) );
			return {
				isCollaborationSupported: selectors.isCollaborationSupported(),
				syncConnectionStatus: selectors.getSyncConnectionStatus(),
			};
		},
		[]
	);

	if ( isCollaborationSupported ) {
		return null;
	}

	if ( DOCUMENT_SIZE_LIMIT_EXCEEDED === syncConnectionStatus?.error?.code ) {
		return (
			<p>
				{ __(
					'Because this post is too large for real-time collaboration, only one person can edit at a time.'
				) }
			</p>
		);
	}

	return (
		<p>
			{ __(
				"Because this post uses plugins that aren't compatible with real-time collaboration, only one person can edit at a time."
			) }
		</p>
	);
}

/**
 * Returns true when the post type supports collaborative editing via the sync
 * infrastructure (syncConfig exists) and collaboration is not blocked by other
 * factors like incompatible meta boxes or document size limits.
 */
function useCollaborationAvailable() {
	return useSelect( ( select ) => {
		if ( ! unlock( select( coreStore ) ).isCollaborationSupported() ) {
			return false;
		}

		const currentPostType = select( editorStore ).getCurrentPostType();
		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			currentPostType
		);
		return Boolean( entityConfig?.syncConfig );
	}, [] );
}

function PostLockedModal() {
	const instanceId = useInstanceId( PostLockedModal );
	const hookName = 'core/editor/post-locked-modal-' + instanceId;
	const { autosave, updatePostLock, updateCollaborationUpgrade } =
		useDispatch( editorStore );
	const { activateCollaboration } = unlock( useDispatch( coreStore ) );

	const {
		isCollaborationEnabled,
		isLocked,
		isTakeover,
		user,
		postId,
		postLockUtils,
		activePostLock,
		postType,
		previewLink,
		collaborationUpgrade,
	} = useSelect( ( select ) => {
		const {
			isCollaborationEnabledForCurrentPost,
			isPostLocked,
			isPostLockTakeover,
			getPostLockUser,
			getCurrentPostId,
			getActivePostLock,
			getEditedPostAttribute,
			getEditedPostPreviewLink,
			getEditorSettings,
			getCollaborationUpgradeStatus,
		} = select( editorStore );
		const { getPostType } = select( coreStore );
		return {
			isCollaborationEnabled: isCollaborationEnabledForCurrentPost(),
			isLocked: isPostLocked(),
			isTakeover: isPostLockTakeover(),
			user: getPostLockUser(),
			postId: getCurrentPostId(),
			postLockUtils: getEditorSettings().postLockUtils,
			activePostLock: getActivePostLock(),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
			previewLink: getEditedPostPreviewLink(),
			collaborationUpgrade: getCollaborationUpgradeStatus(),
		};
	}, [] );

	const collaborationAvailable = useCollaborationAvailable();
	const [ isRequesting, setIsRequesting ] = useState( false );
	const [ isWaitingForOwner, setIsWaitingForOwner ] = useState( false );

	const handleRequestCollaboration = useCallback( () => {
		setIsRequesting( true );
		updateCollaborationUpgrade( { isRequesting: true } );
	}, [ updateCollaborationUpgrade ] );

	// Heartbeat integration for the lock owner (User A): auto-accept
	// collaboration requests and activate the provider.
	useEffect( () => {
		function sendPostLock( data ) {
			if ( isLocked ) {
				return;
			}

			data[ 'wp-refresh-post-lock' ] = {
				lock: activePostLock,
				post_id: postId,
			};
		}

		function receivePostLock( data ) {
			if ( ! data[ 'wp-refresh-post-lock' ] ) {
				return;
			}

			const received = data[ 'wp-refresh-post-lock' ];
			if ( received.lock_error ) {
				autosave();
				updatePostLock( {
					isLocked: true,
					isTakeover: true,
					user: {
						name: received.lock_error.name,
						avatar: received.lock_error.avatar_src_2x,
					},
				} );
			} else if ( received.new_lock ) {
				updatePostLock( {
					isLocked: false,
					activePostLock: received.new_lock,
				} );
			}

			// Lock owner receives a collaboration request from another user.
			if ( data[ 'wp-collaboration-request' ] ) {
				const request = data[ 'wp-collaboration-request' ];
				updateCollaborationUpgrade( {
					isRequestPending: true,
					requestingUser: {
						name: request.name,
						avatar: request.avatar_src,
					},
				} );
			}
		}

		function releasePostLock() {
			if ( isLocked || ! activePostLock ) {
				return;
			}

			const formData = new window.FormData();
			formData.append( 'action', 'wp-remove-post-lock' );
			formData.append( '_wpnonce', postLockUtils.unlockNonce );
			formData.append( 'post_ID', postId );
			formData.append( 'active_post_lock', activePostLock );

			if ( window.navigator.sendBeacon ) {
				window.navigator.sendBeacon( postLockUtils.ajaxUrl, formData );
			} else {
				const xhr = new window.XMLHttpRequest();
				xhr.open( 'POST', postLockUtils.ajaxUrl, false );
				xhr.send( formData );
			}
		}

		addAction( 'heartbeat.send', hookName, sendPostLock );
		addAction( 'heartbeat.tick', hookName, receivePostLock );
		window.addEventListener( 'beforeunload', releasePostLock );

		return () => {
			removeAction( 'heartbeat.send', hookName );
			removeAction( 'heartbeat.tick', hookName );
			window.removeEventListener( 'beforeunload', releasePostLock );
		};
	}, [] );

	// Lock owner (User A): when a collaboration request is pending,
	// auto-accept by enabling the provider and notifying via heartbeat.
	useEffect( () => {
		if ( ! collaborationUpgrade?.isRequestPending || isLocked ) {
			return;
		}

		const acceptHookName = hookName + '/accept-collaboration';

		function sendAcceptance( data ) {
			data[ 'wp-accept-collaboration' ] = { post_id: postId };
		}

		addAction( 'heartbeat.send', acceptHookName, sendAcceptance );

		// Activate the collaboration provider on the lock owner's side.
		activateCollaboration( postType?.slug, postId );
		updateCollaborationUpgrade( { isAccepted: true } );

		return () => {
			removeAction( 'heartbeat.send', acceptHookName );
		};
	}, [
		collaborationUpgrade?.isRequestPending,
		isLocked,
		postId,
		postType?.slug,
		hookName,
		activateCollaboration,
		updateCollaborationUpgrade,
	] );

	// Requester (User B): when requesting collaboration, send the request
	// and poll for acceptance via heartbeat.
	useEffect( () => {
		if ( ! isRequesting || ! isLocked ) {
			return;
		}

		const requestHookName = hookName + '/request-collaboration';

		function sendRequest( data ) {
			if ( ! isWaitingForOwner ) {
				data[ 'wp-request-collaboration' ] = { post_id: postId };
			}
			data[ 'wp-check-collaboration-status' ] = { post_id: postId };
		}

		function receiveStatus( data ) {
			if (
				data[ 'wp-collaboration-status' ]?.status === 'accepted' ||
				data[ 'wp-request-collaboration' ]?.status === 'accepted'
			) {
				setIsWaitingForOwner( true );
			}
		}

		addAction( 'heartbeat.send', requestHookName, sendRequest );
		addAction( 'heartbeat.tick', requestHookName, receiveStatus );

		return () => {
			removeAction( 'heartbeat.send', requestHookName );
			removeAction( 'heartbeat.tick', requestHookName );
		};
	}, [ isRequesting, isLocked, isWaitingForOwner, postId, hookName ] );

	// Requester (User B): once the lock owner has accepted and their session
	// is ready, activate our own provider and dismiss the lock modal.
	useEffect( () => {
		if ( ! isWaitingForOwner ) {
			return;
		}

		activateCollaboration( postType?.slug, postId ).then( () => {
			updatePostLock( {
				isLocked: false,
				activePostLock,
			} );
			updateCollaborationUpgrade( {} );
		} );
	}, [
		isWaitingForOwner,
		postType?.slug,
		postId,
		activePostLock,
		activateCollaboration,
		updatePostLock,
		updateCollaborationUpgrade,
	] );

	if ( ! isLocked ) {
		return null;
	}

	// When collaboration is already fully enabled, skip the lock modal.
	if ( isCollaborationEnabled ) {
		return null;
	}

	const userDisplayName = user.name;
	const userAvatar = user.avatar;

	const unlockUrl = addQueryArgs( 'post.php', {
		'get-post-lock': '1',
		lockKey: true,
		post: postId,
		action: 'edit',
		_wpnonce: postLockUtils.nonce,
	} );
	const allPostsUrl = addQueryArgs( 'edit.php', {
		post_type: postType?.slug,
	} );
	const allPostsLabel = __( 'Exit editor' );

	// Waiting for the lock owner's session to connect.
	if ( isRequesting ) {
		return (
			<Modal
				title={ __( 'Starting collaboration…' ) }
				focusOnMount
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				isDismissible={ false }
				className="editor-post-locked-modal"
				size="medium"
			>
				<HStack alignment="top" spacing={ 6 }>
					<div>
						<p>
							{ isWaitingForOwner
								? __(
										'Connecting to the collaborative session…'
								  )
								: sprintf(
										/* translators: %s: user's display name */
										__(
											'Waiting for %s to join the collaborative session…'
										),
										userDisplayName
								  ) }
						</p>
						<HStack justify="center">
							<Spinner />
						</HStack>
						<HStack
							className="editor-post-locked-modal__buttons"
							justify="flex-end"
						>
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								href={ unlockUrl }
							>
								{ __( 'Take over' ) }
							</Button>
						</HStack>
					</div>
				</HStack>
			</Modal>
		);
	}

	return (
		<Modal
			title={
				isTakeover
					? __( 'Someone else has taken over this post' )
					: __( 'This post is already being edited' )
			}
			focusOnMount
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			isDismissible={ false }
			// Do not remove this class, as this class is used by third party plugins.
			className="editor-post-locked-modal"
			size="medium"
		>
			<HStack alignment="top" spacing={ 6 }>
				{ !! userAvatar && (
					<img
						src={ userAvatar }
						alt={ __( 'Avatar' ) }
						className="editor-post-locked-modal__avatar"
						width={ 64 }
						height={ 64 }
					/>
				) }
				<div>
					{ !! isTakeover && (
						<>
							<p>
								{ createInterpolateElement(
									userDisplayName
										? sprintf(
												/* translators: %s: user's display name */
												__(
													"<strong>%s</strong> now has editing control of this post (<PreviewLink />). Don't worry, your changes up to this moment have been saved."
												),
												userDisplayName
										  )
										: __(
												"Another user now has editing control of this post (<PreviewLink />). Don't worry, your changes up to this moment have been saved."
										  ),
									{
										strong: <strong />,
										PreviewLink: (
											<ExternalLink href={ previewLink }>
												{ __( 'preview' ) }
											</ExternalLink>
										),
									}
								) }
							</p>
							<CollaborationContext />
						</>
					) }
					{ ! isTakeover && (
						<>
							<p>
								{ createInterpolateElement(
									userDisplayName
										? sprintf(
												/* translators: %s: user's display name */
												__(
													'<strong>%s</strong> is currently working on this post (<PreviewLink />), which means you cannot make changes, unless you take over.'
												),
												userDisplayName
										  )
										: __(
												'Another user is currently working on this post (<PreviewLink />), which means you cannot make changes, unless you take over.'
										  ),
									{
										strong: <strong />,
										PreviewLink: (
											<ExternalLink href={ previewLink }>
												{ __( 'preview' ) }
											</ExternalLink>
										),
									}
								) }
							</p>
							<CollaborationContext />
							<p>
								{ __(
									'If you take over, the other user will lose editing control to the post, but their changes will be saved.'
								) }
							</p>
						</>
					) }

					<HStack
						className="editor-post-locked-modal__buttons"
						justify="flex-end"
					>
						{ ! isTakeover && collaborationAvailable && (
							<Button
								__next40pxDefaultSize
								variant="secondary"
								onClick={ handleRequestCollaboration }
							>
								{ __( 'Start collaboration' ) }
							</Button>
						) }
						{ ! isTakeover && (
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								href={ unlockUrl }
							>
								{ __( 'Take over' ) }
							</Button>
						) }
						<Button
							__next40pxDefaultSize
							variant="primary"
							href={ allPostsUrl }
						>
							{ allPostsLabel }
						</Button>
					</HStack>
				</div>
			</HStack>
		</Modal>
	);
}

/**
 * A modal component that is displayed when a post is locked for editing by another user.
 * The modal provides information about the lock status and options to take over or exit the editor.
 *
 * @return {React.ReactNode} The rendered PostLockedModal component.
 */
export default globalThis.IS_GUTENBERG_PLUGIN
	? withFilters( 'editor.PostLockedModal' )( PostLockedModal )
	: PostLockedModal;
