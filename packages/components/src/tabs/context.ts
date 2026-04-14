/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabsContextProps } from './types';

export const TabsContext = createContext< TabsContextProps >( undefined );
TabsContext.displayName = 'TabsContext';

export const useTabsContext = () => useContext( TabsContext );
