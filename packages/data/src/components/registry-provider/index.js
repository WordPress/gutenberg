/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultRegistry from '../../default-registry';

export const RegistryContext = createContext( defaultRegistry );

const { Consumer, Provider } = RegistryContext;

export const RegistryConsumer = Consumer;

export default Provider;
