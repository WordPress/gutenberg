/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { compose } from '@wordpress/compose';
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */

import IsolatedEventContainer from '../isolated-event-container';
import withConstrainedTabbing from '../higher-order/with-constrained-tabbing';
import withFocusReturn from '../higher-order/with-focus-return';
import withFocusOutside from '../higher-order/with-focus-outside';

class ModalFrame extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
		this.focusFirstTabbable = this.focusFirstTabbable.bind( this );
		this.maybeClose = this.maybeClose.bind( this );
		this.handleFocusOutside = this.handleFocusOutside.bind( this );
	}

	/**
	 * Focuses the first tabbable element when props.focusOnMount is true.
	 */
	componentDidMount() {
		// Focus on mount
		if ( this.props.focusOnMount ) {
			this.focusFirstTabbable();
		}
	}

	/**
	 * Focuses the first tabbable element.
	 */
	focusFirstTabbable() {
		const tabbables = focus.tabbable.find( this.containerRef.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	/**
	 * Callback function called when clicked outside the modal.
	 *
	 * @param {Object} event Mouse click event.
	 */
	handleFocusOutside( event ) {
		const { onRequestClose, shouldCloseOnClickOutside } = this.props;

		if ( shouldCloseOnClickOutside && onRequestClose ) {
			onRequestClose( event );
		}
	}

	/**
	 * Stops proagation of the escape key outside the context of the modal.
	 *
	 * @param {Event} event The onKeyDown event.
	 */
	maybeClose( event ) {
		const { onRequestClose, shouldCloseOnEsc } = this.props;

		if ( event.keyCode === ESCAPE && shouldCloseOnEsc && onRequestClose ) {
			event.stopPropagation();
			onRequestClose( event );
		}
	}

	/**
	 * Renders the modal frame element.
	 *
	 * @return {WPElement} The modal frame element.
	 */
	render() {
		const {
			overlayClassName,
			contentLabel,
			aria: {
				describedby,
				labelledby,
			},
			children,
			className,
			role,
			style,
		} = this.props;

		return (
			<IsolatedEventContainer
				className={ classnames( 'components-modal__screen-overlay', overlayClassName ) }
				onKeyDown={ this.maybeClose }
			>
				<div
					className={ classnames(
						'components-modal__frame',
						className
					) }
					style={ style }
					ref={ this.containerRef }
					role={ role }
					aria-label={ contentLabel }
					aria-labelledby={ contentLabel ? null : labelledby }
					aria-describedby={ describedby }
					tabIndex="-1"
				>
					{ children }
				</div>
			</IsolatedEventContainer>
		);
	}
}

export default compose( [
	withFocusReturn,
	withConstrainedTabbing,
	withFocusOutside,
] )( ModalFrame );
