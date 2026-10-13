import { createContext, useContext } from '@wordpress/element';
import type { TabsContextProps } from './types';

export const TabsContext = createContext< TabsContextProps >( undefined );
TabsContext.displayName = 'TabsContext';

export const useTabsContext = () => useContext( TabsContext );
