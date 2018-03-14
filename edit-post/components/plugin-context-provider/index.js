/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Provives context to plugins, in combination with the withPluginContext
 * higher order component.
 */
class PluginContextProvider extends Component {
	getChildContext() {
		return {
			pluginContext: this.props.value,
		};
	}

	render() {
		return this.props.children;
	}
}

PluginContextProvider.childContextTypes = {
	pluginContext: noop,
};

export default PluginContextProvider;
