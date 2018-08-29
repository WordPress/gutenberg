/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getWPAdminURL } from '../../utils/url';
import PostPreviewButton from '../post-preview-button';

function PostLockedModal( { lockNonce, lockDetails, user, postId, isLocked } ) {
	if ( ! isLocked ) {
		return null;
	}

	let modalText, avatar, takeover;
	if ( lockDetails && lockDetails.text ) {
		modalText = lockDetails.text;
		avatar = lockDetails.avatar_src;
		takeover = true;
	} else {
		const displayName = ( user && user.data ) ? user.data.display_name : __( 'Another user' );
		modalText = sprintf( __( '%s is already editing this post. Do you want to take over?' ), displayName );
		avatar = user.data.avatar_src;
	}

	const unlockUrl = addQueryArgs( 'post.php', {
		'get-post-lock': '1',
		_wpnonce: lockNonce,
		lockKey: true,
		post: postId,
		action: 'edit',
	} );
	const allPosts = getWPAdminURL( 'edit.php' );

	return (
		<Fragment>
			<Modal
				title={ takeover ? __( 'Post taken over' ) : __( 'Post locked' ) }
				focusOnMount={ true }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				isDismissable={ false }
				className="editor-post-locked-modal"
			>
				{	!! avatar && (
					<img
						src={ avatar }
						alt={ __( 'Avatar' ) }
						className="editor-post-locked-modal__avatar"
					/>
				) }
				<div>
					<div>{ modalText }</div>
					{ !! takeover && (
						<p>
							<a href={ allPosts }>
								{ __( 'View all posts' ) }
							</a>
						</p>
					) }
					{ ! takeover &&
						<div className="editor-post-locked-modal__buttons">
							<Button isDefault isLarge href={ allPosts }>
								{ __( 'All Posts' ) }
							</Button>
							<PostPreviewButton />
							<Button isPrimary isLarge href={ unlockUrl }>
								{ __( 'Take Over' ) }
							</Button>
						</div>
					}
				</div>
			</Modal>
		</Fragment>
	);
}

export default withSelect( ( select ) => {
	return {
		isLocked: select( 'core/editor' ).isPostLocked(),
		lockDetails: select( 'core/editor' ).getLockDetails(),
		user: select( 'core/editor' ).getPostLockUser(),
		postId: select( 'core/editor' ).getCurrentPost().id,
		lockNonce: select( 'core/editor' ).getEditorSettings().lockNonce,
	};
} )( PostLockedModal );
