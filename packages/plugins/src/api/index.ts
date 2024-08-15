/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */
/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';
import { plugins as pluginsIcon } from '@wordpress/icons';
import type { IconType } from '@wordpress/components';

/**
 * Defined behavior of a plugin type.
 */
export interface WPPlugin {
	/**
	 * A string identifying the plugin. Must be unique across all registered plugins.
	 */
	name: string;

	/**
	 * An icon to be shown in the UI. It can be a slug of the Dashicon, or an
	 * element (or function returning an element) if you choose to render your
	 * own SVG.
	 */
	icon?: IconType;

	/**
	 * A component containing the UI elements to be rendered.
	 */
	render: ComponentType;

	/**
	 * The optional scope to be used when rendering inside a plugin area.
	 * No scope by default.
	 */
	scope?: string;
}

type PluginSettings = Omit< WPPlugin, 'name' >;

/**
 * Plugin definitions keyed by plugin name.
 */
const plugins = {} as Record< string, WPPlugin >;

/**
 * Registers a plugin to the editor.
 *
 * @param name     A string identifying the plugin. Must be
 *                 unique across all registered plugins.
 * @param settings The settings for this plugin.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var el = React.createElement;
 * var Fragment = wp.element.Fragment;
 * var PluginSidebar = wp.editor.PluginSidebar;
 * var PluginSidebarMoreMenuItem = wp.editor.PluginSidebarMoreMenuItem;
 * var registerPlugin = wp.plugins.registerPlugin;
 * var moreIcon = React.createElement( 'svg' ); //... svg element.
 *
 * function Component() {
 * 	return el(
 * 		Fragment,
 * 		{},
 * 		el(
 * 			PluginSidebarMoreMenuItem,
 * 			{
 * 				target: 'sidebar-name',
 * 			},
 * 			'My Sidebar'
 * 		),
 * 		el(
 * 			PluginSidebar,
 * 			{
 * 				name: 'sidebar-name',
 * 				title: 'My Sidebar',
 * 			},
 * 			'Content of the sidebar'
 * 		)
 * 	);
 * }
 * registerPlugin( 'plugin-name', {
 * 	icon: moreIcon,
 * 	render: Component,
 * 	scope: 'my-page',
 * } );
 * ```
 *
 * @example
 * ```js
 * // Using ESNext syntax
 * import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
 * import { registerPlugin } from '@wordpress/plugins';
 * import { more } from '@wordpress/icons';
 *
 * const Component = () => (
 * 	<>
 * 		<PluginSidebarMoreMenuItem
 * 			target="sidebar-name"
 * 		>
 * 			My Sidebar
 * 		</PluginSidebarMoreMenuItem>
 * 		<PluginSidebar
 * 			name="sidebar-name"
 * 			title="My Sidebar"
 * 		>
 * 			Content of the sidebar
 * 		</PluginSidebar>
 * 	</>
 * );
 *
 * registerPlugin( 'plugin-name', {
 * 	icon: more,
 * 	render: Component,
 * 	scope: 'my-page',
 * } );
 * ```
 *
 * @return The final plugin settings object.
 */
export function registerPlugin(
	name: string,
	settings: PluginSettings
): PluginSettings | null {
	if ( typeof settings !== 'object' ) {
		console.error( 'No settings object provided!' );
		return null;
	}
	if ( typeof name !== 'string' ) {
		console.error( 'Plugin name must be string.' );
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Plugin name must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
		return null;
	}
	if ( plugins[ name ] ) {
		console.error( `Plugin "${ name }" is already registered.` );
	}

	settings = applyFilters(
		'plugins.registerPlugin',
		settings,
		name
	) as PluginSettings;

	const { render, scope } = settings;

	if ( typeof render !== 'function' ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}

	if ( scope ) {
		if ( typeof scope !== 'string' ) {
			console.error( 'Plugin scope must be string.' );
			return null;
		}

		if ( ! /^[a-z][a-z0-9-]*$/.test( scope ) ) {
			console.error(
				'Plugin scope must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-page".'
			);
			return null;
		}
	}

	plugins[ name ] = {
		name,
		icon: pluginsIcon,
		...settings,
	};

	doAction( 'plugins.pluginRegistered', settings, name );

	return settings;
}

/**
 * Unregisters a plugin by name.
 *
 * @param name Plugin name.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var unregisterPlugin = wp.plugins.unregisterPlugin;
 *
 * unregisterPlugin( 'plugin-name' );
 * ```
 *
 * @example
 * ```js
 * // Using ESNext syntax
 * import { unregisterPlugin } from '@wordpress/plugins';
 *
 * unregisterPlugin( 'plugin-name' );
 * ```
 *
 * @return The previous plugin settings object, if it has been
 *         successfully unregistered; otherwise `undefined`.
 */
export function unregisterPlugin( name: string ): WPPlugin | undefined {
	if ( ! plugins[ name ] ) {
		console.error( 'Plugin "' + name + '" is not registered.' );
		return;
	}
	const oldPlugin = plugins[ name ];
	delete plugins[ name ];

	doAction( 'plugins.pluginUnregistered', oldPlugin, name );

	return oldPlugin;
}

/**
 * Returns a registered plugin settings.
 *
 * @param name Plugin name.
 *
 * @return Plugin setting.
 */
export function getPlugin( name: string ): WPPlugin | undefined {
	return plugins[ name ];
}

/**
 * Returns all registered plugins without a scope or for a given scope.
 *
 * @param scope The scope to be used when rendering inside
 *              a plugin area. No scope by default.
 *
 * @return The list of plugins without a scope or for a given scope.
 */
export function getPlugins( scope?: string ): WPPlugin[] {
	return Object.values( plugins ).filter(
		( plugin ) => plugin.scope === scope
	);
}
