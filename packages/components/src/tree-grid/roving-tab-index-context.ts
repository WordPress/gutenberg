/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RovingTabIndexContext = createContext<
	| {
			lastFocusedElement: HTMLElement | undefined;
			setLastFocusedElement: React.Dispatch<
				React.SetStateAction< HTMLElement | undefined >
			>;
			// Add a flag to track if we've already set an initial item
			hasInitialFocusableItem: boolean;
			setHasInitialFocusableItem: React.Dispatch<
				React.SetStateAction< boolean >
			>;
	  }
	| undefined
>( undefined );
RovingTabIndexContext.displayName = 'RovingTabIndexContext';

export const useRovingTabIndexContext = () =>
	useContext( RovingTabIndexContext );
export const RovingTabIndexProvider = RovingTabIndexContext.Provider;
