import { Children, createContext, useContext } from '@wordpress/element';
import type { InputLayoutSlotType } from './types';

/**
 * Context for providing slot type information to child components.
 */
export const InputLayoutSlotTypeContext =
	createContext< InputLayoutSlotType | null >( null );

/**
 * Hook to access the current slot context.
 */
export function useInputLayoutSlotContext() {
	return useContext( InputLayoutSlotTypeContext );
}

/**
 * Wrapper component that provides slot type context for prefix and suffix slots.
 */
export function SlotContextProvider( {
	type,
	children,
}: {
	type: InputLayoutSlotType;
	children: React.ReactNode;
} ) {
	if ( Children.count( children ) === 0 ) {
		return null;
	}

	return (
		<InputLayoutSlotTypeContext.Provider value={ type }>
			{ children }
		</InputLayoutSlotTypeContext.Provider>
	);
}
