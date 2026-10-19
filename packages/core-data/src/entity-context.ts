import { createContext } from '@wordpress/element';
import type { EntityContextValue } from './types';

export const EntityContext = createContext< EntityContextValue >( {} );
EntityContext.displayName = 'EntityContext';
