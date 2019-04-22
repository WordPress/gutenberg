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
import { PluginContextProvider } from '../plugin-context';
import { getPlugins } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var PluginArea = wp.plugins.PluginArea;
 *
 * function Layout() {
 * 	return el(
 * 		'div',
 * 		{},
 * 		'Content of the page',
 * 		PluginArea
 * 	);
 * }
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```js
 * // Using ESNext syntax
 * const { PluginArea } = wp.plugins;
 *
 * const Layout = () => (
 * 	<div>
 * 		Content of the page
 * 		<PluginArea />
 * 	</div>
 * );
 * ```
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
			plugins: map( getPlugins(), ( { icon, name, render } ) => {
				return {
					Plugin: render,
					context: {
						name,
						icon,
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
				{ map( this.state.plugins, ( { context, Plugin } ) => (
					<PluginContextProvider
						key={ context.name }
						value={ context }
					>
						<Plugin />
					</PluginContextProvider>
				) ) }
			</div>
		);
	}
}

export default PluginArea;
