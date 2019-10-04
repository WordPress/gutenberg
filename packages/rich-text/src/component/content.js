/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { toElement } from '../to-element';

export default class Content extends Component {
	// We must prevent rerenders because the browser will modify the DOM. React
	// will rerender the DOM fine, but we're losing selection and it would be
	// more expensive to do so as it would just set the inner HTML through
	// `dangerouslySetInnerHTML`. Instead RichText does it's own diffing and
	// selection setting.
	shouldComponentUpdate() {
		return false;
	}

	render() {
		return toElement( this.props );
	}
}
