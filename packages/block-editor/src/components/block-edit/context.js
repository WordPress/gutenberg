/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const mayDisplayControlsKey = Symbol( 'mayDisplayControls' );
export const mayDisplayParentControlsKey = Symbol( 'mayDisplayParentControls' );
export const blockEditingModeKey = Symbol( 'blockEditingMode' );
export const blockBindingsKey = Symbol( 'blockBindings' );

export const DEFAULT_BLOCK_EDIT_CONTEXT = {
	name: '',
	isSelected: false,
};

const Context = createContext( DEFAULT_BLOCK_EDIT_CONTEXT );
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
