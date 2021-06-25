/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<import('./types').PopoverContext>}
 */
export const AccessiblePopoverContext = createContext( {} );
export const useAccessiblePopoverContext = () =>
	useContext( AccessiblePopoverContext );
