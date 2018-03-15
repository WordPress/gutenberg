/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Provides context to plugins, injecting name for slot name assignnment.
 */
class PluginContextProvider extends Component {
	getChildContext() {
		return {
			pluginName: this.props.pluginName,
		};
	}

	render() {
		return this.props.children;
	}
}

PluginContextProvider.childContextTypes = {
	pluginName: noop,
};

export default PluginContextProvider;
