/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';

class PostLockedModal extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isOpen: true,
		}

		this.openModal = this.openModal.bind( this );
		this.closeModal = this.closeModal.bind( this );
	}

	openModal() {
		if ( ! this.state.isOpen ) {
			this.setState( { isOpen: true } );
		}
	}

	closeModal() {
		if ( this.state.isOpen ) {
			this.setState( { isOpen: false } );
		}
	}

	render() {
		return (
			<Fragment>
				<button onClick={ this.openModal }>Open Modal</button>
				{ this.state.isOpen ?
					<Modal
						title={ __( 'Post Locked' ) }
						onRequestClose={ this.closeModal }
						focusOnMount={ true }
						shouldCloseOnClickOutside={ false }
						shouldCloseOnEsc={ false }
						showCloseIcon={ false }
					>
						<div>
							{ __( 'Username is already editing this post. Do you want to take over?')}
						</div>
						<button
							className="button"
							onClick={ this.closeModal }
						>
							Go back
						</button>
						<button
							className="button"
							onClick={ this.closeModal }
						>
							Preview
						</button>
						<button
							className="button-primary"
							onClick={ this.closeModal }
						>
							Take Over
						</button>
					</Modal>
					: null }
			</Fragment>
		);
	}
}

export default PostLockedModal;
