/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusOutside from '../higher-order/with-focus-outside';

class FocusOutside extends Component {
	handleFocusOutside() {
		this.props.onFocusOutside();
	}

	render() {
		return this.props.children;
	}
}

export default withFocusOutside( FocusOutside );
