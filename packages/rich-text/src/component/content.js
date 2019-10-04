/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { toElement } from '../to-element';

export default class Content extends Component {
	shouldComponentUpdate() {
		return false;
	}

	render() {
		return toElement( this.props );
	}
}
