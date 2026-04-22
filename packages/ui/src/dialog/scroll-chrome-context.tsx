import { createContext, useContext } from '@wordpress/element';

export type DialogScrollChromeContextValue = {
	/**
	 * True when the popup is scrolled away from the top (content sits under the header).
	 */
	headerScrolledFromTop: boolean;
	/**
	 * True when more content exists below the visible area (content can scroll under the footer).
	 */
	footerHasContentBelow: boolean;
};

export const DialogScrollChromeContext =
	createContext< DialogScrollChromeContextValue | null >( null );

/**
 * Scroll chrome for sticky `Dialog.Header` / `Dialog.Footer` borders. Returns `null`
 * when used outside `Dialog.Popup`.
 */
export function useDialogScrollChrome(): DialogScrollChromeContextValue | null {
	return useContext( DialogScrollChromeContext );
}
