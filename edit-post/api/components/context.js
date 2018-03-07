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
			namespace: this.props.namespace,
		};
	}

	render() {
		return this.props.children;
	}
}

PluginContextProvider.childContextTypes = {
	namespace: PropTypes.string.isRequired,
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
		namespace: PropTypes.string.isRequired,
	};

	return PluginContextConsumer;
}

export {
	PluginContextProvider,
	withPluginContext,
};
