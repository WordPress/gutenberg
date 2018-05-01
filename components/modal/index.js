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
import { withModalContext } from './context';
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

		const {
			modalContext,
		} = this.props;

		if ( ! this.parentElement ) {
			setElements( modalContext.appElementId );
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

/**
 * Sets the element where the modal should mount itself.
 *
 * Note that the modal will mount itself as a sibling of this element, so using body is
 * not possible since it cannot have additional sibling elements.
 *
 * @param {string} appElementId The element id of the element that contains your application.
 */
function setElements( appElementId ) {
	const element = document.getElementById( appElementId );

	if ( element ) {
		Modal.setAppElement( element );
		Modal.setParentElement( element.parentNode );
	}
}

export { ModalContextProvider } from './context';
export default withModalContext( Modal );
