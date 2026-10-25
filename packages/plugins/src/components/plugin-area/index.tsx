import memoize from 'memize';
import { useInstanceId } from '@wordpress/compose';
import { useMemo, useSyncExternalStore } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import { PluginContextProvider } from '../plugin-context';
import { PluginErrorBoundary } from '../plugin-error-boundary';
import { getPlugins } from '../../api';
import type { PluginContext } from '../plugin-context';
import type { WPPlugin } from '../../api';

const getPluginContext = memoize(
	( icon: PluginContext[ 'icon' ], name: PluginContext[ 'name' ] ) => ( {
		icon,
		name,
	} )
);

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @param  props
 * @param  props.scope
 * @param  props.onError
 * @example
 * ```js
 * // Using ES5 syntax
 * var el = React.createElement;
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
 * @return {Component} The component to be rendered.
 */
function PluginArea( {
	scope,
	onError,
}: {
	scope?: string;
	onError?: ( name: WPPlugin[ 'name' ], error: Error ) => void;
} ) {
	// A namespace of this instance's own: `removeAction` removes every
	// callback registered under a namespace, so instances sharing one would
	// unsubscribe each other when one of them unmounts.
	const namespace = useInstanceId( PluginArea, 'core/plugins/plugin-area' );
	const store = useMemo( () => {
		let lastValue: WPPlugin[] = [];

		return {
			subscribe(
				listener: (
					plugin: Omit< WPPlugin, 'name' >,
					name: WPPlugin[ 'name' ]
				) => void
			) {
				addAction( 'plugins.pluginRegistered', namespace, listener );
				addAction( 'plugins.pluginUnregistered', namespace, listener );
				return () => {
					removeAction( 'plugins.pluginRegistered', namespace );
					removeAction( 'plugins.pluginUnregistered', namespace );
				};
			},
			getValue() {
				const nextValue = getPlugins( scope );

				if ( ! isShallowEqual( lastValue, nextValue ) ) {
					lastValue = nextValue;
				}

				return lastValue;
			},
		};
	}, [ scope, namespace ] );

	const plugins = useSyncExternalStore(
		store.subscribe,
		store.getValue,
		store.getValue
	);

	return (
		<div style={ { display: 'none' } }>
			{ plugins.map( ( { icon, name, render: Plugin } ) => (
				<PluginContextProvider
					key={ name }
					value={ getPluginContext( icon, name ) }
				>
					<PluginErrorBoundary name={ name } onError={ onError }>
						<Plugin />
					</PluginErrorBoundary>
				</PluginContextProvider>
			) ) }
		</div>
	);
}

export default PluginArea;
