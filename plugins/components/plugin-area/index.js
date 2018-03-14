/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginRegistry from '../../api/plugin';
import PluginContextProvider from '../plugin-context-provider';

/**
 * A component that renders all plugin fills in a hidden div.
 */
class PluginArea extends Component {
	render() {
		const pluginRegistry = PluginRegistry.getInstance();

		return (
			<div style={ { display: 'none' } }>
				{ map( pluginRegistry.plugins, plugin => {
					const boundRegisterUIComponent = pluginRegistry.registerUIComponent.bind( pluginRegistry, plugin.name );
					return (
						<PluginContextProvider key={ plugin.name } value={ {
							registerUIComponent: boundRegisterUIComponent,
							namespace: plugin.name,
						} }>
							{ plugin.render() }
						</PluginContextProvider>
					);
				} ) }
			</div>
		);
	}
}

export default PluginArea;
