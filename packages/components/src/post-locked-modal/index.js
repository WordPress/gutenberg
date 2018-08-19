/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { select } from '@wordpress/data';
import {
	PostPreviewButton,
} from '@wordpress/editor';
import './style.scss';
import { addQueryArgs } from '@wordpress/url';
import { getPostEditURL } from '../../../../edit-post/components/browser-url';

class PostLockedModal extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isOpen: true,
		};

		this.takeOverPost = this.takeOverPost.bind( this );

		const user = select( 'core/editor' ).getPostLockUser();
		const displayName = ( user && user.data ) ? user.data.display_name : __( 'Another user' );
		this.takeover = sprintf( __( '%s has taken over and is currently editing. Your latest changes were saved as a revision.' ), displayName );
		this.alreadyEditing = sprintf( __( '%s is already editing this post. Do you want to take over?' ), displayName );
	}

	takeOverPost() {
		const { getEditorSettings, getCurrentPost } = select( 'core/editor' );
		const { lockNonce } = getEditorSettings();
		const { id } = getCurrentPost();
		const unlockUrl = addQueryArgs( getPostEditURL(), {
			'get-post-lock': '1',
			_wpnonce: lockNonce,
			lockKey: true,
			post: id,
		} );
		document.location = unlockUrl;
	}

	goBack() {
		window.history.back();
	}

	render() {
		return (
			<Fragment>
				{
					this.state.isOpen ?
						<Modal
							title={ this.alreadyEditing }
							onRequestClose={ this.closeModal }
							focusOnMount={ true }
							shouldCloseOnClickOutside={ false }
							shouldCloseOnEsc={ false }
							showCloseIcon={ false }
							className="post-locked-modal"
						>

							<button
								className="button"
								onClick={ this.goBack }
							>
								Go back
							</button>
							<PostPreviewButton />
							<button
								className="button button-primary"
								onClick={ this.takeOverPost }
							>
								Take Over
							</button>
						</Modal> :
						null
				}
			</Fragment>
		);
	}
}

export default PostLockedModal;
