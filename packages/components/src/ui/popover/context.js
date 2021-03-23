/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<import('./types').PopoverContext>}
 */
export const PopoverContext = createContext( {} );
export const usePopoverContext = () => useContext( PopoverContext );
