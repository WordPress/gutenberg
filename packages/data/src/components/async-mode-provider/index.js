/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const { Consumer, Provider } = createContext( false );

export const AsyncModeConsumer = Consumer;

export default Provider;
