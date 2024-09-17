/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultRegistry from '../../default-registry';

export const Context = createContext( defaultRegistry );

const { Consumer, Provider } = Context;

/**
 * A custom react Context consumer exposing the provided `registry` to
 * children components. Used along with the RegistryProvider.
 *
 * You can read more about the react context api here:
 * https://react.dev/learn/passing-data-deeply-with-context#step-3-provide-the-context
 *
 * @example
 * ```js
 * import {
 *   RegistryProvider,
 *   RegistryConsumer,
 *   createRegistry
 * } from '@wordpress/data';
 *
 * const registry = createRegistry( {} );
 *
 * const App = ( { props } ) => {
 *   return <RegistryProvider value={ registry }>
 *     <div>Hello There</div>
 *     <RegistryConsumer>
 *       { ( registry ) => (
 *         <ComponentUsingRegistry
 *         		{ ...props }
 *         	  registry={ registry }
 *       ) }
 *     </RegistryConsumer>
 *   </RegistryProvider>
 * }
 * ```
 */
export const RegistryConsumer = Consumer;

/**
 * A custom Context provider for exposing the provided `registry` to children
 * components via a consumer.
 *
 * See <a name="#RegistryConsumer">RegistryConsumer</a> documentation for
 * example.
 */
export default Provider;
