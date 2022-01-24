/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const DEFAULT_GLOBAL_STYLES_CONTEXT = {
	user: {},
	base: {},
	merged: {},
	setUserConfig: () => {},
};

export const GlobalStylesContext = createContext(
	DEFAULT_GLOBAL_STYLES_CONTEXT
);
