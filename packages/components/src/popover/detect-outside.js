/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusOutside from '../higher-order/with-focus-outside';

class PopoverDetectOutside extends Component {
	constructor() {
		super( ...arguments );
		this.handleFocusOutside = this.handleFocusOutside.bind( this );
	}

	handleFocusOutside( event ) {
		this.props.onFocusOutside( event );
	}

	render() {
		return this.props.children;
	}
}

export default withFocusOutside( PopoverDetectOutside );
