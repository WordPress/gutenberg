/**
 * External dependencies
 */
import { map, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { compose } from '@wordpress/compose';

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
 * @return {WPComponent} The component to be rendered.
 */
class PluginArea extends Component {
	constructor() {
		super( ...arguments );

		this.setPlugins = this.setPlugins.bind( this );
		this.memoizedContext = memoize( ( name, icon, priority ) => {
			return {
				name,
				icon,
				priority,
			};
		} );
		this.state = this.getCurrentPluginsState();
	}

	getCurrentPluginsState() {
		const plugins = compose(
			( list ) =>
				map( list, ( { icon, name, render, priority } ) => {
					return {
						Plugin: render,
						context: {
							name,
							icon,
							priority,
						},
					};
				} ),
			( list ) => sortBy( list, [ 'priority' ] )
		)( getPlugins() );

		return {
			plugins: compose(
				( list ) =>
					map( list, ( { icon, name, render, priority } ) => {
						return {
							Plugin: render,
							context: this.memoizedContext(
								name,
								icon,
								priority
							),
						};
					} ),
				( list ) => sortBy( list, [ 'priority' ] )
			)( getPlugins( this.props.scope ) ),
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
						<Plugin />
					</PluginContextProvider>
				) ) }
			</div>
		);
	}
}

export default PluginArea;
