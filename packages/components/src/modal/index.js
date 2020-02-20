/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ModalFrame from './frame';
import ModalHeader from './header';
import * as ariaHelper from './aria-helper';

// Used to count the number of open modals.
let parentElement,
	openModalCount = 0;

class Modal extends Component {
	constructor( props ) {
		super( props );
		this.prepareDOM();
	}

	/**
	 * Appends the modal's node to the DOM, so the portal can render the
	 * modal in it. Also calls the openFirstModal when this is the first modal to be
	 * opened.
	 */
	componentDidMount() {
		openModalCount++;

		if ( openModalCount === 1 ) {
			this.openFirstModal();
		}
	}

	/**
	 * Removes the modal's node from the DOM. Also calls closeLastModal when this is
	 * the last modal to be closed.
	 */
	componentWillUnmount() {
		openModalCount--;

		if ( openModalCount === 0 ) {
			this.closeLastModal();
		}

		this.cleanDOM();
	}

	/**
	 * Prepares the DOM for the modals to be rendered.
	 *
	 * Every modal is mounted in a separate div appended to a parent div
	 * that is appended to the document body.
	 *
	 * The parent div will be created if it does not yet exist, and the
	 * separate div for this specific modal will be appended to that.
	 */
	prepareDOM() {
		if ( ! parentElement ) {
			parentElement = document.createElement( 'div' );
			document.body.appendChild( parentElement );
		}
		this.node = document.createElement( 'div' );
		parentElement.appendChild( this.node );
	}

	/**
	 * Removes the specific mounting point for this modal from the DOM.
	 */
	cleanDOM() {
		parentElement.removeChild( this.node );
	}

	/**
	 * Prepares the DOM for this modal and any additional modal to be mounted.
	 *
	 * It appends an additional div to the body for the modals to be rendered in,
	 * it hides any other elements from screen-readers and adds an additional class
	 * to the body to prevent scrolling while the modal is open.
	 */
	openFirstModal() {
		ariaHelper.hideApp( parentElement );
		document.body.classList.add( this.props.bodyOpenClassName );
	}

	/**
	 * Cleans up the DOM after the last modal is closed and makes the app available
	 * for screen-readers again.
	 */
	closeLastModal() {
		document.body.classList.remove( this.props.bodyOpenClassName );
		ariaHelper.showApp();
	}

	/**
	 * Renders the modal.
	 *
	 * @return {WPElement} The modal element.
	 */
	render() {
		const {
			onRequestClose,
			title,
			icon,
			closeButtonLabel,
			children,
			aria,
			instanceId,
			isDismissible,
			isDismissable, //Deprecated
			// Many of the documented props for Modal are passed straight through
			// to the ModalFrame component and handled there.
			...otherProps
		} = this.props;

		const headingId =
			aria.labelledby || `components-modal-header-${ instanceId }`;

		if ( isDismissable ) {
			deprecated( 'isDismissable prop of the Modal component', {
				alternative:
					'isDismissible prop (renamed) of the Modal component',
			} );
		}
		// Disable reason: this stops mouse events from triggering tooltips and
		// other elements underneath the modal overlay.
		return createPortal(
			<ModalFrame
				onRequestClose={ onRequestClose }
				aria={ {
					labelledby: title ? headingId : null,
					describedby: aria.describedby,
				} }
				{ ...otherProps }
			>
				<div
					className={ 'components-modal__content' }
					tabIndex="0"
					role="document"
				>
					<ModalHeader
						closeLabel={ closeButtonLabel }
						headingId={ headingId }
						icon={ icon }
						isDismissible={ isDismissible || isDismissable }
						onClose={ onRequestClose }
						title={ title }
					/>
					{ children }
				</div>
			</ModalFrame>,
			this.node
		);
	}
}

Modal.defaultProps = {
	bodyOpenClassName: 'modal-open',
	role: 'dialog',
	title: null,
	focusOnMount: true,
	shouldCloseOnEsc: true,
	shouldCloseOnClickOutside: true,
	isDismissible: true,
	/* accessibility */
	aria: {
		labelledby: null,
		describedby: null,
	},
};

export default withInstanceId( Modal );
