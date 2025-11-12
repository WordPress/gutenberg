/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ContextProps } from './types';

export const Context = createContext< ContextProps | undefined >( undefined );
Context.displayName = 'MenuContext';
