/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

const { Consumer, Provider } = createContext( {
	name: null,
} );

export { Provider as PluginContextProvider };

/**
 * A Higher Order Component used to inject Plugin context to the
 * wrapped component.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which has Plugin context injected.
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
