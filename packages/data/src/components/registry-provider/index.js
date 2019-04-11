/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import defaultRegistry from '../../default-registry';

const { Consumer, Provider } = createContext( defaultRegistry );

export const RegistryConsumer = Consumer;

export default Provider;
