/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RovingTabIndexContext = createContext<
	| {
			lastFocusedElement: Element | undefined;
			setLastFocusedElement: React.Dispatch<
				React.SetStateAction< Element | undefined >
			>;
	  }
	| undefined
>( undefined );
export const useRovingTabIndexContext = () =>
	useContext( RovingTabIndexContext );
export const RovingTabIndexProvider = RovingTabIndexContext.Provider;
