/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<import('./types').Context>}
 */
export const AccessiblePopoverContext = createContext( {} );
export const useAccessiblePopoverContext = () =>
	useContext( AccessiblePopoverContext );
