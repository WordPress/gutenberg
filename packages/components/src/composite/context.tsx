/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CompositeContextProps } from './types';

export const CompositeContext =
	createContext< CompositeContextProps >( undefined );

export const useCompositeContext = () => useContext( CompositeContext );
