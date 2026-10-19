import { createContext } from '@wordpress/element';
import type { ContextProps } from './types';

export const Context = createContext< ContextProps | undefined >( undefined );
Context.displayName = 'MenuContext';
