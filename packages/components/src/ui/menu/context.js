/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/** @type {import('react').Context<{ menu?: import('reakit').MenuStateReturn }>} */
export const MenuContext = createContext( {} );
export const useMenuContext = () => useContext( MenuContext );
