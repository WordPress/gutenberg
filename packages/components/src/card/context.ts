/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const CardContext = createContext( {} );
CardContext.displayName = 'CardContext';

export const useCardContext = () => useContext( CardContext );
