/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const DEFAULT_GLOBAL_STYLES_CONTEXT = {
	user: {},
	site: {},
	base: {},
	merged: {},
	setUserConfig: () => {},
	setSiteConfig: () => {},
};

export const GlobalStylesContext = createContext(
	DEFAULT_GLOBAL_STYLES_CONTEXT
);
