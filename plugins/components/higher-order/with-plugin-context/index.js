/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Higher-order component creator that creates a new component and provides
 * the plugin context provided by the PluginContextProvider component as
 * props to that component under props.pluginContext.
 *
 * @param {ReactElement} WrappedComponent The component to be decorated.
 *
 * @return {PluginContextConsumer} The higher order component.
 */
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

export default withPluginContext;
