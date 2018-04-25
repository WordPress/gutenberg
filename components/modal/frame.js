/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { defer } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose, createRef } from '@wordpress/element';
import { focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import withFocusReturn from '../higher-order/with-focus-return';
import withFocusContain from '../higher-order/with-focus-contain';

const ESC_KEY = 27;

class ModalFrame extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
		this.handleKeyPressEvents = this.handleKeyPressEvents.bind( this );
	}

	componentDidMount() {
		// Focus on mount
		if ( this.props.focusOnMount ) {
			this.focusFirstTabbable();
		}
		// Key events
		window.addEventListener( 'keydown', this.handleKeyPressEvents );
	}

	componentWillUnmount() {
		window.removeEventListener( 'keydown', this.handleKeyPressEvents );
	}

	focusFirstTabbable() {
		// Required because the node is appended to the DOM after rendering.
		defer( () => {
			const tabbables = focus.tabbable.find( this.containerRef.current );
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			}
		} );
	}

	handleClickOutside( event ) {
		if ( this.props.shouldCloseOnClickOutside ) {
			this.onRequestClose( event );
		}
	}

	handleKeyPressEvents( event ) {
		if ( event.keyCode === ESC_KEY ) {
			this.handleEscapePress( event );
		}
	}

	handleEscapePress( event ) {
		if ( this.props.shouldCloseOnEsc ) {
			event.preventDefault();
			this.onRequestClose( event );
		}
	}

	onRequestClose( event ) {
		const { onRequestClose } = this.props;
		if ( onRequestClose ) {
			onRequestClose( event );
		}
	}

	render() {
		const {
			contentLabel,
			aria: {
				describedby,
				labelledby,
			},
			children,
			className,
			style,
		} = this.props;

		return (
			<div
				className={ className }
				style={ style }
				ref={ this.containerRef }
				role="dialog"
				aria-modal={ true }
				aria-label={ contentLabel }
				aria-labelledby={ labelledby }
				aria-describedby={ describedby }>
				{ children }
			</div>
		);
	}
}

export default compose( [
	withFocusReturn,
	withFocusContain,
	clickOutside,
] )( ModalFrame );
