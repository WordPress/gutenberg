/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RovingTabIndexContext = createContext<
	| {
			lastFocusedElement?: Element | null;
			setLastFocusedElement?: React.Dispatch<
				React.SetStateAction< Element | null >
			>;
	  }
	| undefined
>( undefined );
export const useRovingTabIndexContext = () =>
	useContext( RovingTabIndexContext );
export const RovingTabIndexProvider = RovingTabIndexContext.Provider;
