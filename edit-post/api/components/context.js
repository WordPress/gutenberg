/**
 * External dependencies
 */
import PropTypes from 'prop-types';

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
	pluginContext: PropTypes.any.isRequired,
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
		pluginContext: PropTypes.any.isRequired,
	};

	return PluginContextConsumer;
}

export {
	PluginContextProvider,
	withPluginContext,
};
