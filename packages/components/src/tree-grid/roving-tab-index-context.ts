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
			isInitialRender: boolean;
			registerItem: ( element: HTMLElement | null ) => void;
	  }
	| undefined
>( undefined );
RovingTabIndexContext.displayName = 'RovingTabIndexContext';

export const useRovingTabIndexContext = () =>
	useContext( RovingTabIndexContext );
export const RovingTabIndexProvider = RovingTabIndexContext.Provider;
