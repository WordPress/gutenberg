/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { WPPlugin } from '../../api';

export interface PluginContext {
	name: null | WPPlugin[ 'name' ];
	icon: null | WPPlugin[ 'icon' ];
}

const Context = createContext< PluginContext >( {
	name: null,
	icon: null,
} );

export const PluginContextProvider = Context.Provider;

/**
 * A hook that returns the plugin context.
 *
 * @return {PluginContext} Plugin context
 */
export function usePluginContext() {
	return useContext( Context );
}

/**
 * A Higher Order Component used to inject Plugin context to the
 * wrapped component.
 *
 * @deprecated 6.8.0 Use `usePluginContext` hook instead.
 *
 * @param  mapContextToProps Function called on every context change,
 *                           expected to return object of props to
 *                           merge with the component's own props.
 *
 * @return {Component} Enhanced component with injected context as props.
 */
export const withPluginContext = (
	mapContextToProps: < T >(
		context: PluginContext,
		props: T
	) => T & PluginContext
) =>
	createHigherOrderComponent( ( OriginalComponent ) => {
		deprecated( 'wp.plugins.withPluginContext', {
			since: '6.8.0',
			alternative: 'wp.plugins.usePluginContext',
		} );
		return ( props ) => (
			<Context.Consumer>
				{ ( context ) => (
					<OriginalComponent
						{ ...props }
						{ ...mapContextToProps( context, props ) }
					/>
				) }
			</Context.Consumer>
		);
	}, 'withPluginContext' );
