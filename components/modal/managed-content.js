/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';

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

class ManagedOverlay extends Component {
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
		const tabbables = focus.tabbable.find( this.containerRef.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	handleClickOutside( event ) {
		this.onRequestClose( event );
	}

	handleKeyPressEvents( event ) {
		if ( event.keyCode === 27 /* escape */ ) {
			this.handleEscapePress( event );
		}
	}

	handleEscapePress( event ) {
		event.preventDefault();
		this.onRequestClose( event );
	}

	onRequestClose( event ) {
		const { onRequestClose } = this.props;
		if ( onRequestClose ) {
			onRequestClose( event );
		}
	}

	render() {
		const {
			children,
			className,
			isOpen = true,
		} = this.props;

		if ( ! isOpen ) {
			return null;
		}

		return (
			<div className={ className } ref={ this.containerRef } role="dialog" aria-modal={ true }>
				{ children }
			</div>
		);
	}
}

export default compose( [
	withFocusReturn,
	withFocusContain,
	clickOutside,
] )( ManagedOverlay );
