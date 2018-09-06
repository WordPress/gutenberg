/**
 * External dependencies
 */
import jQuery from 'jquery';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';

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
		jQuery( document )
			.on( 'heartbeat-send.refresh-lock', this.sendPostLock )
			.on( 'heartbeat-tick.refresh-lock', this.receivePostLock )
			.on( 'beforeunload.edit-post', this.releasePostLock );
	}

	componentWillUnmount() {
		jQuery( document )
			.off( 'heartbeat-send.refresh-lock', this.sendPostLock )
			.off( 'heartbeat-tick.refresh-lock', this.receivePostLock )
			.off( 'beforeunload.edit-post', this.releasePostLock );
	}

	/**
	 * Keep the lock refreshed.
	 *
	 * When the user does not send a heartbeat in a heartbeat-tick
	 * the user is no longer editing and another user can start editing.
	 *
	 * @param {Object} event Event.
	 * @param {Object} data  Data to send in the heartbeat request.
	 */
	sendPostLock( event, data ) {
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
	 * @param {Object} event Event.
	 * @param {Object} data  Data received in the heartbeat request
	 */
	receivePostLock( event, data ) {
		if ( data[ 'wp-refresh-post-lock' ] ) {
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
	}

	/**
	 * Unlock the post before the window is exited.
	 *
	 * @param {Object} event Event.
	 */
	releasePostLock( event ) {
		// Make sure we process only the main document unload.
		if ( event.target && event.target.nodeName !== '#document' ) {
			return;
		}

		const { isLocked, activePostLock, postLockUtils, postId } = this.props;
		if ( isLocked || ! activePostLock ) {
			return;
		}

		const data = {
			action: 'wp-remove-post-lock',
			_wpnonce: postLockUtils.nonce,
			post_ID: postId,
			active_post_lock: activePostLock,
		};

		jQuery.post( {
			async: false,
			url: postLockUtils.ajaxUrl,
			data,
		} );
	}

	render() {
		const { user, postId, isLocked, isTakeover, postLockUtils, postType } = this.props;
		if ( ! isLocked ) {
			return null;
		}

		const userDisplayName = user.name || __( 'Another user' );
		const userAvatar = user.avatar;

		const unlockUrl = addQueryArgs( 'post.php', {
			'get-post-lock': '1',
			lockKey: true,
			post: postId,
			action: 'edit',
			_wpnonce: postLockUtils.nonce,
		} );
		const allPosts = getWPAdminURL( 'edit.php' );
		return (
			<Modal
				title={ isTakeover ? __( 'Someone else has taken over this post.' ) : __( 'This post is already being edited.' ) }
				focusOnMount={ true }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				isDismissable={ false }
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
							<strong>{ userDisplayName }</strong> { sprintf( __( 'now has editing control of this %s. Don\'t worry, your changes up to this moment have been saved' ), postType ) }
						</div>
						<p>
							<a href={ allPosts }>
								{ __( 'View all posts' ) }
							</a>
						</p>
					</div>
				) }
				{ ! isTakeover && (
					<div>
						<div>
							<strong>{ userDisplayName }</strong> { sprintf( __( 'is currently working on this %s, which means you cannot make changes, unless you take over.' ), postType ) }
						</div>

						<div className="editor-post-locked-modal__buttons">
							<Button isDefault isLarge href={ allPosts }>
								{ __( 'All Posts' ) }
							</Button>
							<PostPreviewButton />
							<Button isPrimary isLarge href={ unlockUrl }>
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
			getEditorSettings,
			isPostLocked,
			isPostLockTakeover,
			getPostLockUser,
			getCurrentPostId,
			getActivePostLock,
			getEditedPostAttribute,
		} = select( 'core/editor' );
		return {
			isLocked: isPostLocked(),
			isTakeover: isPostLockTakeover(),
			user: getPostLockUser(),
			postId: getCurrentPostId(),
			postLockUtils: getEditorSettings().postLockUtils,
			activePostLock: getActivePostLock(),
			postType: getEditedPostAttribute( 'type' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { autosave, updatePostLock } = dispatch( 'core/editor' );
		return {
			autosave,
			updatePostLock,
		};
	} )
)( PostLockedModal );
