import { createContext, useContext } from '@wordpress/element';
import type { CompositeContextProps } from './types';

export const CompositeContext = createContext< CompositeContextProps >( {} );
CompositeContext.displayName = 'CompositeContext';

export const useCompositeContext = () => useContext( CompositeContext );

export const CompositeGroupContext = createContext( false );
CompositeGroupContext.displayName = 'CompositeGroupContext';

export const useCompositeGroupContext = () =>
	useContext( CompositeGroupContext );
