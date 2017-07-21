/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

export default class ApiProvider extends Component {
	getChildContext() {
		return {
			getApiSchema: () => this.props.schema,
			getApiRoot: () => this.props.root,
			getApiNonce: () => this.props.nonce,
		};
	}

	render() {
		return this.props.children;
	}
}

ApiProvider.childContextTypes = {
	getApiSchema: noop,
	getApiRoot: noop,
	getApiNonce: noop,
};
