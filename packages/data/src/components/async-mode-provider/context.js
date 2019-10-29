/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const Context = createContext( false );

const { Consumer, Provider } = Context;

export const AsyncModeConsumer = Consumer;

/**
 * Context Provider Component used to switch the data module component rerendering
 * between Sync and Async modes.
 *
 * @param {boolean}   props.value  Enable Async Mode.
 * @return {WPComponent} The component to be rendered.
 */
export default Provider;
