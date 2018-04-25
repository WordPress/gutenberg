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
		ReactModal.setAppElement( document.getElementById( 'wpwrap' ) );

		const {
			isOpen,
			render,
			style,
			className,
			overlayClassName,
			contentClassName,
			ariaLabelledBy,
			icon,
			title,
			bodyOpenClassName,
			onRequestClose,
			children } = this.props;

		return <ReactModal
			style={ style }
			isOpen={ isOpen }
			render={ render }
			className={ className }
			overlayClassName={ overlayClassName }
			bodyOpenClassName={ bodyOpenClassName }
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
	isOpen: false,
	render: true,
	style: {},
	className: 'components-modal',
	overlayClassName: 'components-modal__screen-overlay',
	contentClassName: 'components-modal__content',
	ariaLabelledBy: 'modalID',
	icon: null,
	title: 'Plugin screen',
	onRequestClose: null,
	bodyOpenClassName: 'modal-body--open',
};

export default Modal;
