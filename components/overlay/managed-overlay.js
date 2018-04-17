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
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.focusFirstTabbable();
		}
		window.addEventListener( 'keydown', event => {
			if ( event.keyCode === 27 /* escape */ ) {
				this.handleEscapePress( event );
			}
		} );
	}

	focusFirstTabbable() {
		const tabbables = focus.tabbable.find( this.containerRef.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	handleClickOutside( event ) {
		this.requestClose( event );
	}

	handleEscapePress( event ) {
		event.preventDefault();
		this.requestClose( event );
	}

	requestClose( event ) {
		const { requestClose } = this.props;
		if ( requestClose ) {
			requestClose( event );
		}
	}

	render() {
		const { children, className } = this.props;
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
