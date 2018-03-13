/**
 * External dependencies
 */
import withFocusReturn from '../higher-order/with-focus-return';
import withFocusOutside from '../higher-order/with-focus-outside';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';

class PopoverDetectOutside extends Component {
	handleFocusOutside( event ) {
		const { onFocusOutside } = this.props;
		if ( onFocusOutside ) {
			onFocusOutside( event );
		}
	}

	render() {
		return this.props.children;
	}
}

export default compose( [
	withFocusReturn,
	withFocusOutside,
] )( PopoverDetectOutside );
