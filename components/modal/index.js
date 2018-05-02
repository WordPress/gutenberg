/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ModalFrame from './frame';
import ModalHeader from './header';
import * as ariaHelper from './aria-helper';
import './style.scss';

// Used to count the number of open modals.
let parentElement,
	openModalCount = 0;

class Modal extends Component {
	constructor() {
		super( ...arguments );

		this.node = document.createElement( 'div' );
	}

	componentDidMount() {
		const { isOpen } = this.props;
		if ( isOpen ) {
			this.openModal();
		}
	}

	componentDidUpdate( prevProps ) {
		const openStateChanged = this.props.isOpen !== prevProps.isOpen;
		if ( openStateChanged && ! prevProps.isOpen ) {
			this.openModal();
		} else if ( openStateChanged && prevProps.isOpen ) {
			this.closeModal();
		}
	}

	componentWillUnmount() {
		const { isOpen } = this.props;
		if ( isOpen ) {
			this.closeModal();
		}
	}

	openModal() {
		openModalCount++;

		if ( openModalCount === 1 ) {
			this.openFirstModal();
		}
		parentElement.appendChild( this.node );
	}

	openFirstModal() {
		parentElement = document.createElement( 'div' );
		document.body.appendChild( parentElement );
		ariaHelper.hideApp( parentElement );
		document.body.classList.add( this.props.bodyOpenClassName );
	}

	closeModal() {
		openModalCount--;

		parentElement.removeChild( this.node );
		if ( openModalCount === 0 ) {
			this.closeLastModal();
		}
	}

	closeLastModal() {
		document.body.classList.remove( this.props.bodyOpenClassName );
		ariaHelper.showApp();
		document.body.removeChild( parentElement );
		parentElement = null;
	}

	render() {
		const {
			isOpen,
			overlayClassName,
			className,
			onRequestClose,
			style: {
				content,
				overlay,
			},
			title,
			icon,
			closeButtonLabel,
			children,
			...otherProps
		} = this.props;

		if ( ! isOpen ) {
			return null;
		}

		return createPortal(
			<div
				className={ classnames(
					'components-modal__screen-overlay',
					overlayClassName
				) }
				style={ overlay }>
				<ModalFrame
					style={ content }
					className={ classnames(
						'components-modal__frame',
						className
					) }
					onRequestClose={ onRequestClose }
					{ ...otherProps } >
					<ModalHeader
						closeLabel={ closeButtonLabel }
						onClose={ onRequestClose }
						title={ title }
						icon={ icon } />
					<div
						className={ 'components-modal__content' }>
						{ children }
					</div>
				</ModalFrame>
			</div>,
			this.node
		);
	}
}

Modal.defaultProps = {
	className: null,
	overlayClassName: null,
	bodyOpenClassName: 'modal-open',
	role: 'dialog',
	title: null,
	onRequestClose: noop,
	focusOnMount: true,
	shouldCloseOnEsc: true,
	shouldCloseOnClickOutside: true,
	style: {
		content: null,
		overlay: null,
	},
	/* accessibility */
	contentLabel: null,
	aria: {
		labelledby: 'modal-heading',
		describedby: null,
	},
};

export default Modal;
