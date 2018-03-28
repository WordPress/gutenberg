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
import PluginContextProvider from '../plugin-context-provider';
import { getPlugins, subscribe } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @return {WPElement} Plugin area.
 */
function PluginArea( { plugins } ) {
	return (
		<div style={ { display: 'none' } }>
			{ map( plugins, ( plugin ) => {
				const { render: Plugin } = plugin;

				return (
					<PluginContextProvider
						key={ plugin.name }
						pluginName={ plugin.name }
					>
						<Plugin />
					</PluginContextProvider>
				);
			} ) }
		</div>
	);
}

class PluginsAreaProvider extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			plugins: getPlugins(),
		};
	}

	updatePlugins( plugins ) {
		this.setState( { plugins } );
	}

	componentDidMount() {
		subscribe( this.updatePlugins.bind( this ) );
	}

	render() {
		return <PluginArea plugins={ this.state.plugins } />;
	}
}

export default PluginsAreaProvider;
