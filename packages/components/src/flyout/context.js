/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<import('./types').Context>}
 */
export const FlyoutContext = createContext( {} );
export const useFlyoutContext = () => useContext( FlyoutContext );
