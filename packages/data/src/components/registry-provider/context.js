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

export const RegistryConsumer = Consumer;

export default Provider;
