/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

export interface GlobalStylesContextType {
	user: GlobalStylesConfig;
	base: GlobalStylesConfig;
	merged: GlobalStylesConfig;
	onChange: ( newValue: GlobalStylesConfig ) => void;
	fontLibraryEnabled?: boolean;
}

export const GlobalStylesContext = createContext< GlobalStylesContextType >( {
	user: { styles: {}, settings: {} },
	base: { styles: {}, settings: {} },
	merged: { styles: {}, settings: {} },
	onChange: () => {},
	fontLibraryEnabled: false,
} );
