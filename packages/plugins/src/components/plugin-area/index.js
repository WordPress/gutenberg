/**
 * External dependencies
 */
import { map } from 'lodash';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { PluginContextProvider } from '../plugin-context';
import { PluginErrorBoundary } from '../plugin-error-boundary';
import { getPlugins } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var PluginArea = wp.plugins.PluginArea;
 *
 * function Layout() {
 * 	return el(
 * 		'div',
 * 		{ scope: 'my-page' },
 * 		'Content of the page',
 * 		PluginArea
 * 	);
 * }
 * ```
 *
 * @example
 * ```js
 * // Using ESNext syntax
 * import { PluginArea } from '@wordpress/plugins';
 *
 * const Layout = () => (
 * 	<div>
 * 		Content of the page
 * 		<PluginArea scope="my-page" />
 * 	</div>
 * );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
class PluginArea extends Component {
	constructor() {
		super( ...arguments );

		this.setPlugins = this.setPlugins.bind( this );
		this.memoizedContext = memoize( ( name, icon ) => {
			return {
				name,
				icon,
			};
		} );
		this.state = this.getCurrentPluginsState();
	}

	getCurrentPluginsState() {
		return {
			plugins: map(
				getPlugins( this.props.scope ),
				( { icon, name, render } ) => {
					return {
						Plugin: render,
						context: this.memoizedContext( name, icon ),
					};
				}
			),
		};
	}

	componentDidMount() {
		addAction(
			'plugins.pluginRegistered',
			'core/plugins/plugin-area/plugins-registered',
			this.setPlugins
		);
		addAction(
			'plugins.pluginUnregistered',
			'core/plugins/plugin-area/plugins-unregistered',
			this.setPlugins
		);
	}

	componentWillUnmount() {
		removeAction(
			'plugins.pluginRegistered',
			'core/plugins/plugin-area/plugins-registered'
		);
		removeAction(
			'plugins.pluginUnregistered',
			'core/plugins/plugin-area/plugins-unregistered'
		);
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
						<PluginErrorBoundary
							name={ context.name }
							onError={ this.props.onError }
						>
							<Plugin />
						</PluginErrorBoundary>
					</PluginContextProvider>
				) ) }
			</div>
		);
	}
}

export default PluginArea;
