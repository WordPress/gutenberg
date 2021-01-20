/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const defaultLayout = { type: 'default' };
export const flexHorizontalLayout = { type: 'flex-horizontal' };

const Layout = createContext( defaultLayout );

/**
 * Allows to define the layout.
 */
export const LayoutProvider = Layout.Provider;

/**
 * React hook used to retrieve the layout config.
 */
export function useLayout() {
	return useContext( Layout );
}
