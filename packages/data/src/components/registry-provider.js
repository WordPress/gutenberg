/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent, createElement } from '@wordpress/element';

const { Consumer, Provider } = createContext( null );

export { Provider as RegistryProvider };

/**
 * A Higher Order Component used to inject the data registry as a prop
 * to the wrapped component.
 *
 * @param {Componoent} OriginalComponent Component to wrap.
 *
 * @return {Component} Enhanced component with injected context as props.
 */
export const withRegistry = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( registry ) => (
				<OriginalComponent registry={ registry } { ...props } />
			) }
		</Consumer>
	);
}, 'withRegistry' );
