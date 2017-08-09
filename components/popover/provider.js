/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class PopoverProvider extends Component {
	getChildContext() {
		return {
			popoverTarget: this.props.target,
		};
	}

	render() {
		return this.props.children;
	}
}

PopoverProvider.childContextTypes = {
	popoverTarget: noop,
};

export default PopoverProvider;
