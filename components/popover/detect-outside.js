/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusReturn from '../higher-order/with-focus-return';

class PopoverDetectOutside extends Component {
	handleClickOutside( event ) {
		const { onClickOutside } = this.props;
		if ( onClickOutside ) {
			onClickOutside( event );
		}
	}

	render() {
		return this.props.children;
	}
}

export default flowRight( [
	withFocusReturn,
	clickOutside,
] )( PopoverDetectOutside );
