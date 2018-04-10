/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import PluginContext from '../plugin-context';
import { getPlugins } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @return {WPElement} Plugin area.
 */
class PluginArea extends Component {
	constructor() {
		super( ...arguments );

		this.setPlugins = this.setPlugins.bind( this );
		this.state = this.getCurrentPluginsState();
	}

	getCurrentPluginsState() {
		return {
			plugins: map( getPlugins(), ( { name, render } ) => {
				return {
					name,
					Plugin: render,
					context: {
						pluginName: name,
					},
				};
			} ),
		};
	}

	componentDidMount() {
		addAction( 'plugins.pluginRegistered', 'core/plugins/plugin-area/plugins-registered', this.setPlugins );
		addAction( 'plugins.pluginUnregistered', 'core/plugins/plugin-area/plugins-unregistered', this.setPlugins );
	}

	componentWillUnmount() {
		removeAction( 'plugins.pluginRegistered', 'core/plugins/plugin-area/plugins-registered' );
		removeAction( 'plugins.pluginUnregistered', 'core/plugins/plugin-area/plugins-unregistered' );
	}

	setPlugins() {
		this.setState( this.getCurrentPluginsState );
	}

	render() {
		return (
			<div style={ { display: 'none' } }>
				{ map( this.state.plugins, ( { context, name, Plugin } ) => (
					<PluginContext.Provider
						key={ name }
						value={ context }
					>
						<Plugin />
					</PluginContext.Provider>
				) ) }
			</div>
		);
	}
}

export default PluginArea;
