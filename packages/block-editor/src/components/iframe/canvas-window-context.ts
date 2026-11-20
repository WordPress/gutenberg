import { createContext } from '@wordpress/element';

// The window of the iframe the canvas renders in, for the block list to match
// viewport media queries against. Undefined without an iframe, where the top
// window is the canvas. Private: `useMediaQuery` must not read it implicitly,
// as other UI inside the canvas (popovers) matches the top window.
export const CanvasWindowContext = createContext< Window | undefined >(
	undefined
);
