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
 * @example
 *
 * ```js
 * import { useSelect, AsyncModeProvider } from '@wordpress/data';
 *
 * function BlockCount() {
 *   const count = useSelect( ( select ) => {
 *     return select( 'core/block-editor' ).getBlockCount()
 *   }, [] );
 *
 *   return count;
 * }
 *
 * function App() {
 *   return (
 *     <AsyncModeProvider value={ true }>
 *       <BlockCount />
 *     </AsyncModeProvider>
 *   );
 * }
 * ```
 *
 * In this example, the BlockCount component is rerendered asynchronously.
 * It means if a more critical task is being performed (like typing in an input),
 * the rerendering is delayed until the browser becomes IDLE.
 * It is possible to nest multiple levels of AsyncModeProvider to fine-tune the rendering behavior.
 *
 * @param {boolean}   props.value  Enable Async Mode.
 * @return {WPComponent} The component to be rendered.
 */
export default Provider;
