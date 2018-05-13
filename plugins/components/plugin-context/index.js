/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

const { Consumer, Provider } = createContext( {
	name: null,
	icon: null,
} );

export { Provider as PluginContextProvider };

/**
 * A Higher-order Component used to inject Plugin context into the wrapped
 * component.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component with Plugin context injected.
 */
export const withPluginContext = createHigherOrderComponent(
	( OriginalComponent ) => ( props ) => (
		<Consumer>
			{ ( pluginContext ) => (
				<OriginalComponent
					{ ...props }
					pluginContext={ pluginContext }
				/>
			) }
		</Consumer>
	),
	'withPluginContext'
);
