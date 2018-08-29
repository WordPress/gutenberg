/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getWPAdminURL } from '../../utils/url';
import PostPreviewButton from '../post-preview-button';

function PostLockedModal( { user, postId, isLocked, isTakeover, nonce } ) {
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
		_wpnonce: nonce,
	} );
	const allPosts = getWPAdminURL( 'edit.php' );

	return (
		<Modal
			title={ isTakeover ? __( 'Post taken over' ) : __( 'Post locked' ) }
			focusOnMount={ true }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			isDismissable={ false }
			className="editor-post-locked-modal"
		>
			{	!! userAvatar && (
				<img
					src={ userAvatar }
					alt={ __( 'Avatar' ) }
					className="editor-post-locked-modal__avatar"
				/>
			) }
			{ !! isTakeover && (
				<div>
					<p>{ sprintf( __( '%s has taken over and is currently editing.' ), userDisplayName ) }</p>
					<p>
						<a href={ allPosts }>
							{ __( 'View all posts' ) }
						</a>
					</p>
				</div>
			) }
			{ ! isTakeover && (
				<div>
					<p>{ sprintf( __( '%s is already editing this post. Do you want to take over?' ), userDisplayName ) }</p>
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

export default withSelect( ( select ) => {
	const {
		getEditorSettings,
		isPostLocked,
		isPostLockTakeover,
		getPostLockUser,
		getCurrentPost,
	} = select( 'core/editor' );
	return {
		isLocked: isPostLocked(),
		isTakeover: isPostLockTakeover(),
		user: getPostLockUser(),
		postId: getCurrentPost().id,
		nonce: getEditorSettings().postLockUtils.nonce,
	};
} )( PostLockedModal );
