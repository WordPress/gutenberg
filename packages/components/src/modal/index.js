/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DialogFrame from './frame';
import DialogHeader from './header';
import * as ariaHelper from './aria-helper';
import IsolatedEventContainer from '../isolated-event-container';

// Used to count the number of open dialogs.
let parentElement,
	openDialogCount = 0;

class Dialog extends Component {
	constructor( props ) {
		super( props );

		this.prepareDOM();
	}

	/**
	 * Appends the dialog's node to the DOM, so the portal can render the
	 * dialog in it. Also calls the openFirstDialog when this is the first dialog to be
	 * opened.
	 */
	componentDidMount() {
		openDialogCount++;

		if ( openDialogCount === 1 ) {
			this.openFirstDialog();
		}
	}

	/**
	 * Removes the dialog's node from the DOM. Also calls closeLastDialog when this is
	 * the last dialog to be closed.
	 */
	componentWillUnmount() {
		openDialogCount--;

		if ( openDialogCount === 0 ) {
			this.closeLastDialog();
		}

		this.cleanDOM();
	}

	/**
	 * Prepares the DOM for the dialogs to be rendered.
	 *
	 * Every dialog is mounted in a separate div appended to a parent div
	 * that is appended to the document body.
	 *
	 * The parent div will be created if it does not yet exist, and the
	 * separate div for this specific dialog will be appended to that.
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
	 * Removes the specific mounting point for this dialog from the DOM.
	 */
	cleanDOM() {
		parentElement.removeChild( this.node );
	}

	/**
	 * Prepares the DOM for this dialog and any additional dialog to be mounted.
	 *
	 * It appends an additional div to the body for the dialogs to be rendered in,
	 * it hides any other elements from screen-readers and adds an additional class
	 * to the body to prevent scrolling while the dialog is open.
	 */
	openFirstDialog() {
		ariaHelper.hideApp( parentElement );
		document.body.classList.add( this.props.bodyOpenClassName );
	}

	/**
	 * Cleans up the DOM after the last dialog is closed and makes the app available
	 * for screen-readers again.
	 */
	closeLastDialog() {
		document.body.classList.remove( this.props.bodyOpenClassName );
		ariaHelper.showApp();
	}

	/**
	 * Renders the dialog.
	 *
	 * @return {WPElement} The dialog element.
	 */
	render() {
		const {
			overlayClassName,
			className,
			onRequestClose,
			title,
			icon,
			closeButtonLabel,
			children,
			aria,
			instanceId,
			isDismissable,
			...otherProps
		} = this.props;

		const headingId = aria.labelledby || `components-dialog-header-${ instanceId }`;

		// Disable reason: this stops mouse events from triggering tooltips and
		// other elements underneath the dialog overlay.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return createPortal(
			<IsolatedEventContainer
				className={ classnames( 'components-dialog__screen-overlay', overlayClassName ) }
			>
				<DialogFrame
					className={ classnames(
						'components-dialog__frame',
						className
					) }
					onRequestClose={ onRequestClose }
					aria={ {
						labelledby: title ? headingId : null,
						describedby: aria.describedby,
					} }
					{ ...otherProps }
				>
					<div className={ 'components-dialog__content' } tabIndex="0">
						<DialogHeader
							closeLabel={ closeButtonLabel }
							headingId={ headingId }
							icon={ icon }
							isDismissable={ isDismissable }
							onClose={ onRequestClose }
							title={ title }
						/>
						{ children }
					</div>
				</DialogFrame>
			</IsolatedEventContainer>,
			this.node
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

Dialog.defaultProps = {
	bodyOpenClassName: 'dialog-open',
	role: 'dialog',
	title: null,
	onRequestClose: noop,
	focusOnMount: true,
	shouldCloseOnEsc: true,
	shouldCloseOnClickOutside: true,
	isDismissable: true,
	/* accessibility */
	aria: {
		labelledby: null,
		describedby: null,
	},
};

export default withInstanceId( Dialog );
