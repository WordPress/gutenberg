/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, cloneElement, Children } from '@wordpress/element';

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

class PluginContextConsumer extends Component {
	render() {
		return cloneElement( Children.only( this.props.children ), this.context );
	}
}

PluginContextConsumer.contextTypes = {
	namespace: PropTypes.string.isRequired,
};

function withPluginContext( WrappedComponent ) {
	return ( props ) => (
		<PluginContextConsumer>
			<WrappedComponent { ...props } />
		</PluginContextConsumer>
	);
}

export {
	PluginContextProvider,
	withPluginContext,
};
