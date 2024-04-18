/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

/** @typedef {import('react').ReactNode} ReactNode */

export const Context = createContext( {
	value: false,
	overrideChildren: false,
} );

/**
 * Context Provider Component used to switch the data module component rerendering
 * between Sync and Async modes.
 *
 * @example
 *
 * ```js
 * import { useSelect, AsyncModeProvider } from '@wordpress/data';
 * import { store as blockEditorStore } from '@wordpress/block-editor';
 *
 * function BlockCount() {
 *   const count = useSelect( ( select ) => {
 *     return select( blockEditorStore ).getBlockCount()
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
 * @param {Object}    props                  The component props.
 * @param {boolean}   props.value            Enable Async Mode.
 * @param {boolean}   props.overrideChildren Forces the async mode value to all children AsyncModeProviders.
 * @param {ReactNode} props.children         The children to be rendered.
 * @return {ReactNode} The component to be rendered.
 */
function AsyncModeProvider( { value, children, overrideChildren = false } ) {
	const { value: parentValue } = useContext( Context );
	const currentValue = useMemo(
		() => ( {
			value,
			overrideChildren,
		} ),
		[ value, overrideChildren ]
	);
	const appliedValue = parentValue.overrideChildren
		? parentValue
		: currentValue;

	return (
		<Context.Provider value={ appliedValue }>{ children }</Context.Provider>
	);
}

export default AsyncModeProvider;
