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
	modalCount = 0,
	openModalCount = 0;

class Modal extends Component {
	constructor() {
		super( ...arguments );

		if ( ! parentElement ) {
			parentElement = document.createElement( 'div' );
			document.body.appendChild( parentElement );
		}
		this.node = document.createElement( 'div' );
	}

	componentDidMount() {
		modalCount++;

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

		modalCount--;
		if ( modalCount === 0 ) {
			document.body.removeChild( parentElement );
			parentElement = null;
		}
	}

	openModal() {
		openModalCount++;

		ariaHelper.hideApp( parentElement );
		parentElement.appendChild( this.node );
	}

	closeModal() {
		openModalCount--;

		parentElement.removeChild( this.node );
		if ( openModalCount === 0 ) {
			ariaHelper.showApp();
		}
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
		labelledby: null,
		describedby: null,
	},
};

export default Modal;
