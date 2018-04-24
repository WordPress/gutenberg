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
import ModalHeader from './modalHeader';

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
		const {
			isOpen,
			render,
			className,
			overlayClassName,
			ariaLabelledBy,
			icon,
			title,
			children } = this.props;

		return <ReactModal
			isOpen={ isOpen }
			render={ render }
			className={ className }
			overlayClassName={ overlayClassName }
			aria-labelledby={ ariaLabelledBy }
			onRequestClose={ this.onClose }>
			<ModalHeader icon={ icon } title={ title } onClose={ this.onClose } />
			<div className="edit-post-plugin-screen-takeover__editor-screen-takeover-content" aria-labelledby="modalID">
				{ children }
			</div>
		</ReactModal>;
	}
}

Modal.defaultProps = {
	isOpen: true,
	render: true,
	className: 'edit-post-plugin-screen-takeover__editor-screen-takeover',
	overlayClassName: 'edit-post-plugin-screen-takeover__editor-screen-takeover-overlay',
	ariaLabelledBy: 'modalID',
	icon: null,
	title: 'modal',
};

export default Modal;