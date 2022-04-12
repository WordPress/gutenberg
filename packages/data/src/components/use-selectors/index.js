/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

/**
 *
 * Retrieve the controls of a store, so that it can be used to get data in event callbacks.
 *
 * @param {string} storeName Key of the store to get controls for.
 *
 * **Don't use `useSelect` for calling the selectors in the render
 * function because your component won't re-render on a data change.
 * You need to use useSelect in that case.**
 *
 * ```js
 * import { useSelect } from '@wordpress/data';
 *
 * function Paste( { children } ) {
 *   const { getSettings } = useSelect( 'my-shop' );
 *   function onPaste() {
 *     // Do something with the settings.
 *     const settings = getSettings();
 *   }
 *   return <div onPaste={ onPaste }>{ children }</div>;
 * }
 * ```
 *
 * @return {Object} The store's selectors.
 */
export default function useSelectors( storeName ) {
	const registry = useRegistry();

	return registry.select( storeName );
}
