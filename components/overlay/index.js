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

class Overlay extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.focusFirstTabbable();
		}
	}

	focusFirstTabbable() {
		const tabbables = focus.tabbable.find( this.containerRef );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	render() {
		return (
			<div ref={ this.containerRef } role="dialog" aria-modal="true">
				{ ...this.props.children }
			</div>
		);
	}
}

export default compose( [
	withFocusReturn,
	withFocusContain,
] )( Overlay );
