/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import ReactModal from 'react-modal';

ReactModal.setAppElement( document.getElementById( 'wpwrap' ) );

class Modal extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isOpen: true,
			height: window.innerHeight - 32,
		};

		this.updateWindowHeight = this.updateWindowHeight.bind( this );
		this.onClose = this.onClose.bind( this );
	}

	componentDidMount() {
		window.addEventListener( 'resize', this.updateWindowHeight );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.updateWindowHeight );
	}

	updateWindowHeight() {
		this.setState( {
			height: window.innerHeight - 32,
		} );
	}

	onClose() {
		this.setState( {
			isOpen: false,
		} );
	}

	render() {
		const { children } = this.props;
		return <ReactModal
			isOpen={ true }
			render={ true }
			className={ 'edit-post-plugin-screen-takeover__editor-screen-takeover' }
			overlayClassName={ 'edit-post-plugin-screen-takeover__editor-screen-takeover-overlay' }
			aria-labelledby="modalID">
			{ children }
		</ReactModal>;
	}
}

export default Modal;
