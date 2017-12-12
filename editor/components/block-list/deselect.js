/**
 * External dependencies
 */
import withClickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class BlockListDeselect extends Component {
	handleClickOutside() {
		this.props.onDeselect( ...arguments );
	}

	render() {
		return this.props.children;
	}
}

export default withClickOutside( BlockListDeselect );
