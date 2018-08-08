/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

		this.openModal = this.openModal.bind( this );
		this.takeOver = this.takeOver.bind( this );

		this.takeover = __( ' admin has taken over and is currently editing. Your latest changes were saved as a revision. ' );
	}

	openModal() {
		if ( ! this.state.isOpen ) {
			this.setState( { isOpen: true } );
		}
	}

	takeOver() {
		const { getCurrentPost, getEditorSettings } = select( 'core/editor' );
		const { id } = getCurrentPost();
		const { lockNonce } = getEditorSettings();
		const unlockUrl = addQueryArgs( getPostEditURL(), {
			'get-post-lock': '1',
			'nonce': lockNonce,
			lockKey: true,
		} );

		document.location = unlockUrl;
	}

	goBack() {
		window.history.back();
	}

	render() {
		const user = select( 'core/editor' ).getPostLockUser();
		return (
			<Fragment>
				<button onClick={ this.openModal }>Open Modal</button>
				{
					this.state.isOpen ?
						<Modal
							title={ user.data.display_name + __( ' is already editing this post. Do you want to take over?' ) }
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
								onClick={ this.takeOver }
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
