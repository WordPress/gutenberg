/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

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

function withPluginContext( WrappedComponent ) {
	class PluginContextConsumer extends Component {
		render() {
			return <WrappedComponent
				{ ...this.props }
				{ ...this.context }
			/>;
		}
	}

	PluginContextConsumer.contextTypes = {
		pluginContext: noop,
	};

	return PluginContextConsumer;
}

export {
	PluginContextProvider,
	withPluginContext,
};
