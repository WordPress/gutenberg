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
	modalCount = 0;

class Modal extends Component {
	constructor() {
		super( ...arguments );

		this.node = document.createElement( 'div' );
	}

	static setAppElement( node ) {
		ariaHelper.setAppElement( node );
	}

	static setParentElement( node ) {
		if ( ! parentElement ) {
			parentElement = node;
		}
	}

	componentDidMount() {
		modalCount++;

		if ( ! this.parentElement ) {
			setElements();
		}

		ariaHelper.hideApp();
		parentElement.appendChild( this.node );
	}

	componentWillUnmount() {
		modalCount--;

		if ( modalCount === 0 ) {
			ariaHelper.showApp();
		}
		parentElement.removeChild( this.node );
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

function setElements() {
	const wpwrapEl = document.getElementById( 'wpwrap' );

	if ( wpwrapEl ) {
		Modal.setAppElement( wpwrapEl );
		Modal.setParentElement( wpwrapEl.parentNode );
	}
}

export default Modal;
