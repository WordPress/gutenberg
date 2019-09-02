/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withFocusOutside from '../higher-order/with-focus-outside';
import withFocusReturn from '../higher-order/with-focus-return';
import withConstrainedTabbing from '../higher-order/with-constrained-tabbing';

class ModalFrame extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
		this.handleFocusOutside = this.handleFocusOutside.bind( this );
		this.focusFirstTabbable = this.focusFirstTabbable.bind( this );
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
		if ( this.props.shouldCloseOnClickOutside ) {
			this.onRequestClose( event );
		}
	}

	/**
	 * Calls the onRequestClose callback props when it is available.
	 *
	 * @param {Object} event Event object.
	 */
	onRequestClose( event ) {
		const { onRequestClose } = this.props;
		if ( onRequestClose ) {
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
			<div
				className={ className }
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
		);
	}
}

export default compose( [
	withFocusReturn,
	withConstrainedTabbing,
	withFocusOutside,
] )( ModalFrame );
