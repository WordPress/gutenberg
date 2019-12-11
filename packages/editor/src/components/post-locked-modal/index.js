/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { Component } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { compose, withGlobalEvents, withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getWPAdminURL } from '../../utils/url';
import PostPreviewButton from '../post-preview-button';

class PostLockedModal extends Component {
	constructor() {
		super( ...arguments );

		this.sendPostLock = this.sendPostLock.bind( this );
		this.receivePostLock = this.receivePostLock.bind( this );
		this.releasePostLock = this.releasePostLock.bind( this );
	}

	componentDidMount() {
		const hookName = this.getHookName();

		// Details on these events on the Heartbeat API docs
		// https://developer.wordpress.org/plugins/javascript/heartbeat-api/
		addAction( 'heartbeat.send', hookName, this.sendPostLock );
		addAction( 'heartbeat.tick', hookName, this.receivePostLock );
	}

	componentWillUnmount() {
		const hookName = this.getHookName();

		removeAction( 'heartbeat.send', hookName );
		removeAction( 'heartbeat.tick', hookName );
	}

	/**
	 * Returns a `@wordpress/hooks` hook name specific to the instance of the
	 * component.
	 *
	 * @return {string} Hook name prefix.
	 */
	getHookName() {
		const { instanceId } = this.props;
		return 'core/editor/post-locked-modal-' + instanceId;
	}

	/**
	 * Keep the lock refreshed.
	 *
	 * When the user does not send a heartbeat in a heartbeat-tick
	 * the user is no longer editing and another user can start editing.
	 *
	 * @param {Object} data Data to send in the heartbeat request.
	 */
	sendPostLock( data ) {
		const { isLocked, activePostLock, postId } = this.props;
		if ( isLocked ) {
			return;
		}

		data[ 'wp-refresh-post-lock' ] = {
			lock: activePostLock,
			post_id: postId,
		};
	}

	/**
	 * Refresh post locks: update the lock string or show the dialog if somebody has taken over editing.
	 *
	 * @param {Object} data Data received in the heartbeat request
	 */
	receivePostLock( data ) {
		if ( ! data[ 'wp-refresh-post-lock' ] ) {
			return;
		}

		const { autosave, updatePostLock } = this.props;
		const received = data[ 'wp-refresh-post-lock' ];
		if ( received.lock_error ) {
			// Auto save and display the takeover modal.
			autosave();
			updatePostLock( {
				isLocked: true,
				isTakeover: true,
				user: {
					avatar: received.lock_error.avatar_src,
				},
			} );
		} else if ( received.new_lock ) {
			updatePostLock( {
				isLocked: false,
				activePostLock: received.new_lock,
			} );
		}
	}

	/**
	 * Unlock the post before the window is exited.
	 */
	releasePostLock() {
		const { isLocked, activePostLock, postLockUtils, postId } = this.props;
		if ( isLocked || ! activePostLock ) {
			return;
		}

		const data = new window.FormData();
		data.append( 'action', 'wp-remove-post-lock' );
		data.append( '_wpnonce', postLockUtils.unlockNonce );
		data.append( 'post_ID', postId );
		data.append( 'active_post_lock', activePostLock );

		if ( window.navigator.sendBeacon ) {
			window.navigator.sendBeacon( postLockUtils.ajaxUrl, data );
		} else {
			const xhr = new window.XMLHttpRequest();
			xhr.open( 'POST', postLockUtils.ajaxUrl, false );
			xhr.send( data );
		}
	}

	render() {
		const { user, postId, isLocked, isTakeover, postLockUtils, postType } = this.props;
		if ( ! isLocked ) {
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
		const allPostsUrl = getWPAdminURL( 'edit.php', {
			post_type: get( postType, [ 'slug' ] ),
		} );
		const allPostsLabel = __( 'Exit the Editor' );
		return (
			<Modal
				title={ isTakeover ? __( 'Someone else has taken over this post.' ) : __( 'This post is already being edited.' ) }
				focusOnMount={ true }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				isDismissible={ false }
				className="editor-post-locked-modal"
			>
				{ !! userAvatar && (
					<img
						src={ userAvatar }
						alt={ __( 'Avatar' ) }
						className="editor-post-locked-modal__avatar"
					/>
				) }
				{ !! isTakeover && (
					<div>
						<div>
							{ userDisplayName ?
								sprintf(
									/* translators: %s: user's display name */
									__( '%s now has editing control of this post. Don’t worry, your changes up to this moment have been saved.' ),
									userDisplayName
								) :
								__( 'Another user now has editing control of this post. Don’t worry, your changes up to this moment have been saved.' )
							}
						</div>

						<div className="editor-post-locked-modal__buttons">
							<Button isPrimary href={ allPostsUrl }>
								{ allPostsLabel }
							</Button>
						</div>
					</div>
				) }
				{ ! isTakeover && (
					<div>
						<div>
							{ userDisplayName ?
								sprintf(
									/* translators: %s: user's display name */
									__( '%s is currently working on this post, which means you cannot make changes, unless you take over.' ),
									userDisplayName
								) :
								__( 'Another user is currently working on this post, which means you cannot make changes, unless you take over.' )
							}
						</div>

						<div className="editor-post-locked-modal__buttons">
							<Button isSecondary href={ allPostsUrl }>
								{ allPostsLabel }
							</Button>
							<PostPreviewButton />
							<Button isPrimary href={ unlockUrl }>
								{ __( 'Take Over' ) }
							</Button>
						</div>
					</div>
				) }
			</Modal>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const {
			isPostLocked,
			isPostLockTakeover,
			getPostLockUser,
			getCurrentPostId,
			getActivePostLock,
			getEditedPostAttribute,
			getEditorSettings,
		} = select( 'core/editor' );
		const { getPostType } = select( 'core' );
		return {
			isLocked: isPostLocked(),
			isTakeover: isPostLockTakeover(),
			user: getPostLockUser(),
			postId: getCurrentPostId(),
			postLockUtils: getEditorSettings().postLockUtils,
			activePostLock: getActivePostLock(),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { autosave, updatePostLock } = dispatch( 'core/editor' );
		return {
			autosave,
			updatePostLock,
		};
	} ),
	withInstanceId,
	withGlobalEvents( {
		beforeunload: 'releasePostLock',
	} )
)( PostLockedModal );
