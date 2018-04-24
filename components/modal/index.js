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
			height: window.innerHeight - 32,
		};

		this.updateWindowHeight = this.updateWindowHeight.bind( this );
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

	render() {
		const {
			isOpen,
			render,
			className,
			overlayClassName,
			contentClassName,
			ariaLabelledBy,
			icon,
			title,
			onRequestClose,
			children } = this.props;

		return <ReactModal
			isOpen={ isOpen }
			render={ render }
			className={ className }
			overlayClassName={ overlayClassName }
			aria-labelledby={ ariaLabelledBy }
			onRequestClose={ onRequestClose }>
			<ModalHeader icon={ icon } title={ title } onClose={ onRequestClose } />
			<div className={ contentClassName } aria-labelledby="modalID">
				{ children }
			</div>
		</ReactModal>;
	}
}

Modal.defaultProps = {
	isOpen: true,
	render: true,
	className: 'edit-post-plugin-modal__editor-modal',
	overlayClassName: 'edit-post-plugin-modal__editor-modal-overlay',
	contentClassName: 'edit-post-plugin-modal__editor-modal-content',
	ariaLabelledBy: 'modalID',
	icon: null,
	title: 'Plugin screen',
	onRequestClose: null,
};

export default Modal;