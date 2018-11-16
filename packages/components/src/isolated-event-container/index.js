/**
 * External dependencies
 */
import { Component } from '@wordpress/element';

class IsolatedEventContainer extends Component {
	constructor( props ) {
		super( props );

		this.stopEventPropagationOutsideContainer = this.stopEventPropagationOutsideContainer.bind( this );
	}

	stopEventPropagationOutsideContainer( event ) {
		event.stopPropagation();
	}

	render() {
		const { children, ... props } = this.props;

		// Disable reason: this stops certain events from propagating outside of the component.
		//   - onMouseDown is disabled as this can cause interactions with other DOM elements
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				{ ... props }
				onMouseDown={ this.stopEventPropagationOutsideContainer }
			>
				{ children }
			</div>
		);
	}
}

export default IsolatedEventContainer;
