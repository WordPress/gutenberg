/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const Context = createContext( {
	name: '',
	isSelected: false,
	clientId: null,
} );
const { Provider } = Context;

export { Provider as BlockEditContextProvider };

/**
 * A hook that returns the block edit context.
 *
 * @return {Object} Block edit context
 */
export function useBlockEditContext() {
	return useContext( Context );
}
