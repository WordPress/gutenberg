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
class PluginArea extends Component {
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
		this.unsubscribe = subscribe( this.updatePlugins.bind( this ) );
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	render() {
		return (
			<div style={ { display: 'none' } }>
				{ map( this.state.plugins, ( plugin ) => {
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
}

export default PluginArea;
