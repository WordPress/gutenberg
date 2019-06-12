/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const Context = createContext( false );

const { Consumer, Provider } = Context;

export const AsyncModeConsumer = Consumer;

export default Provider;
