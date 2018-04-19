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
import ModalContent from './modal-content';
import * as ariaHelper from './aria-helper';
import './style.scss';

let modalCount = 0;

function getParentElement( parentSelector ) {
	return parentSelector ? parentSelector() : document.body;
}

class Modal extends Component {
	static setAppElement( node ) {
		ariaHelper.setAppElement( node );
	}

	componentDidMount() {
		modalCount++;
		ariaHelper.hideApp();

		getParentElement(
			this.props.parentSelector
		).appendChild( this.node );
	}

	componentWillUnmount() {
		modalCount--;
		if ( modalCount === 0 ) {
			ariaHelper.showApp();
		}

		getParentElement(
			this.props.parentSelector
		).removeChild( this.node );
		ariaHelper.showApp();
	}

	render() {
		const {
			overlayClassName,
			className,
			style: {
				content,
				overlay,
			},
			children,
			...otherProps
		} = this.props;

		if ( ! this.node ) {
			this.node = document.createElement( 'div' );
		}

		return createPortal(
			<div
				className={ classnames(
					'components-modal__screen-overlay',
					overlayClassName
				) }
				style={ overlay }>
				<ModalContent
					style={ content }
					className={ classnames(
						'components-modal__content',
						className
					) }
					{ ...otherProps } >
					{ children }
				</ModalContent>
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
	parentSelector: () => document.body,
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
