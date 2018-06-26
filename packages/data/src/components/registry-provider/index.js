/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const { Consumer, Provider } = createContext( null );

export const RegistryConsumer = Consumer;

export default Provider;
